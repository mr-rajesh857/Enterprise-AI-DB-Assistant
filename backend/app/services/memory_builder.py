"""
Asynchronous "Sleep Agent" Memory Builder Pipeline.
Processes past executed queries into reusable, value-agnostic templates with watermark gating,
SHA-256 deduplication, PII privacy enforcement, and fixed batch capacity bounds.
"""
import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from google import genai
from google.genai import types

from app.config import settings
from app.database import SessionLocal
from app.models.chat import ChatMessage, ChatSession
from app.models.audit_log import AuditLog
from app.models.memory import QueryMemory
from app.services.memory_service import scrub_pii, compute_intent_hash

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Global watermark tracker for background memory builds
LAST_MEMORY_BUILD_WATERMARK: float = 0.0

def run_memory_builder_cycle(batch_limit: int = 200) -> Dict[str, Any]:
    """
    Executes the background "Sleep Agent" Memory Build Pipeline.
    Returns stats dict: {status, new_memories_created, skipped_count, watermark_skipped}.
    """
    global LAST_MEMORY_BUILD_WATERMARK
    db: Session = SessionLocal()

    try:
        # ── 1. Watermark Gating ─────────────────────────────────────────────────
        latest_msg = db.query(func.max(ChatMessage.created_at)).scalar()
        if not latest_msg:
            return {"status": "skipped", "reason": "No messages in database", "created": 0}

        latest_timestamp = latest_msg.timestamp()
        if latest_timestamp <= LAST_MEMORY_BUILD_WATERMARK:
            print("💤 [Sleep Agent Pipeline] Watermark check: No new executed queries since last cycle. Skipping build.")
            return {"status": "skipped", "reason": "Watermark unchanged", "created": 0}

        print(f"⚙️ [Sleep Agent Pipeline] New queries detected! Starting memory build cycle (Batch cap: {batch_limit})...")

        # ── 2. Fetch Unprocessed Executed Assistant Messages ───────────────────
        assistant_messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.role == "assistant", ChatMessage.sql_query.isnot(None), ChatMessage.status == "success")
            .order_by(ChatMessage.created_at.desc())
            .limit(batch_limit)
            .all()
        )

        if not assistant_messages:
            LAST_MEMORY_BUILD_WATERMARK = latest_timestamp
            db.close()
            return {"status": "skipped", "reason": "No successful SQL queries found", "created": 0}

        created_count = 0
        skipped_count = 0

        for assistant_msg in assistant_messages:
            # Pair with previous user question
            user_msg = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == assistant_msg.session_id, ChatMessage.role == "user", ChatMessage.created_at <= assistant_msg.created_at)
                .order_by(ChatMessage.created_at.desc())
                .first()
            )

            if not user_msg or not user_msg.content:
                continue

            # Identify User ID from session owner
            session = db.query(ChatSession).filter(ChatSession.id == assistant_msg.session_id).first()
            user_id = session.user_id if session else None

            # ── 3. SHA-256 Hashing & Smart Deduplication ───────────────────────
            intent_hash = compute_intent_hash(user_msg.content)
            existing_mem = db.query(QueryMemory).filter(QueryMemory.intent_hash == intent_hash).first()

            if existing_mem:
                skipped_count += 1
                continue

            # ── 4. Value-Agnostic LLM Pattern Clustering & Template Abstraction ──
            is_clean, scrubbed_question = scrub_pii(user_msg.content)
            if not is_clean:
                print(f"🛡️ [Privacy Gate] Sensitive PII detected in question: '{user_msg.content}'. Scrubbing before memory generation.")

            canonical_pattern = scrubbed_question.strip()
            raw_sql = assistant_msg.sql_query.strip()

            # Generate accurate, value-agnostic SQL template with parameter slot hints
            prompt = f"""You are a universal database SQL template abstraction engine.
Analyze the natural language user question and executed SQL query below.
Extract and generate the canonical, value-agnostic SQL query template that fully and accurately answers the question.

User Question: "{scrubbed_question}"
Executed SQL: "{raw_sql}"

Instructions:
1. Preserve all required SQL clauses (SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, AGGREGATES like COUNT, SUM, AVG) necessary to completely satisfy the question intent.
2. Abstract dynamic session filters (such as specific user IDs, account numbers, active user filters) into generic parameter placeholders like {{user_id}}.
3. Ensure the SQL template is 100% valid, complete, executable, and value-agnostic.
4. Output ONLY raw executable SQL text without any markdown formatting or code blocks.
"""
            try:
                llm_template_res = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=[prompt],
                    config=types.GenerateContentConfig(temperature=0.0)
                )
                sql_template = llm_template_res.text.strip() if llm_template_res.text else raw_sql
                sql_template = sql_template.replace("```sql", "").replace("```", "").strip()
            except Exception as e:
                print(f"⚠️ [Sleep Agent Pipeline] Template abstraction fallback: {e}")
                sql_template = raw_sql

            # ── 5. Mandatory Privacy Enforcement Gate ─────────────────────────
            sql_clean, scrubbed_sql = scrub_pii(sql_template)

            # Persist clean memory (both Shared and User-Specific Tier)
            new_memory = QueryMemory(
                user_id=None,  # Shared Agent Tier
                intent_hash=intent_hash,
                canonical_question=canonical_pattern,
                sql_template=scrubbed_sql,
                sample_question=scrubbed_question,
                is_pii_clean=is_clean and sql_clean,
                usage_count=1
            )
            db.add(new_memory)

            # Also add User-Specific Tier copy if user_id exists
            if user_id:
                user_memory = QueryMemory(
                    user_id=user_id,
                    intent_hash=intent_hash,
                    canonical_question=canonical_pattern,
                    sql_template=scrubbed_sql,
                    sample_question=scrubbed_question,
                    is_pii_clean=is_clean and sql_clean,
                    usage_count=1
                )
                db.add(user_memory)

            created_count += 1

        db.commit()
        LAST_MEMORY_BUILD_WATERMARK = latest_timestamp
        print(f"✅ [Sleep Agent Pipeline] Memory build cycle completed: Created {created_count} templates, skipped {skipped_count} duplicates.")

        return {
            "status": "success",
            "created": created_count,
            "skipped": skipped_count,
            "watermark": LAST_MEMORY_BUILD_WATERMARK
        }

    except Exception as e:
        db.rollback()
        print(f"❌ [Sleep Agent Pipeline] Error during build cycle: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
