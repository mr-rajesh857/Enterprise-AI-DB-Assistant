import re
import hashlib
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.memory import QueryMemory

# Privacy & Compliance Gate - Regex Patterns for PII / PHI Detection
EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
SSN_REGEX   = r'\b\d{3}-\d{2}-\d{4}\b'
CREDIT_CARD_REGEX = r'\b(?:\d[ -]*?){13,16}\b'

def scrub_pii(text: str) -> Tuple[bool, str]:
    """
    Privacy Enforcement Gate: Scans text for PII/PHI.
    Returns (is_clean, scrubbed_text).
    """
    if not text:
        return True, ""

    scrubbed = text
    scrubbed = re.sub(EMAIL_REGEX, "[REDACTED_EMAIL]", scrubbed)
    scrubbed = re.sub(PHONE_REGEX, "[REDACTED_PHONE]", scrubbed)
    scrubbed = re.sub(SSN_REGEX, "[REDACTED_SSN]", scrubbed)

    is_clean = (scrubbed == text)
    return is_clean, scrubbed

def compute_intent_hash(text: str) -> str:
    """
    Computes a deterministic SHA-256 hash of normalized natural language text.
    """
    normalized = re.sub(r'\s+', ' ', text.strip().lower())
    # Remove punctuation
    normalized = re.sub(r'[^\w\s]', '', normalized)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

import json
from google import genai
from google.genai import types
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def bind_runtime_parameters(sql_template: str, user_id: Optional[int] = None) -> str:
    """
    Dynamic Runtime Parameter Slot Binding:
    Injects active session parameters (e.g., current user ID) into variable slots.
    Ensures User A and User B running the same template only retrieve their own data.
    """
    if not sql_template:
        return ""
    
    bound_sql = sql_template
    if user_id is not None:
        bound_sql = bound_sql.replace("{user_id}", str(user_id))
        bound_sql = bound_sql.replace("{current_user_id}", str(user_id))
    
    return bound_sql

def evaluate_semantic_intent(user_message: str, candidates: List[QueryMemory]) -> Optional[QueryMemory]:
    """
    Semantic Intent Matcher Engine:
    Uses LLM decision engine to judge whether an incoming question ('who is the user')
    requests the same underlying database information as any stored candidate pattern ('what the user name').
    Ignores differences in phrasing, word order, filler words, or synonyms with ZERO hardcoded rules.
    """
    if not candidates or not user_message:
        return None

    # Prepare candidate list JSON for LLM evaluation
    candidate_items = [
        {"id": mem.id, "pattern": mem.canonical_question, "sample": mem.sample_question}
        for mem in candidates[:10]  # candidate bounding to keep context window small
    ]

    prompt = f"""You are a universal semantic query intent matcher.
Determine if the user's incoming question requests the EXACT SAME underlying database information as any stored question pattern below.
Ignore differences in phrasing, word order, filler words, or synonyms.

Incoming Question: "{user_message}"

Candidate Patterns:
{json.dumps(candidate_items, indent=2)}

Respond with JSON ONLY in this format:
{{"matched_id": <int_id_or_null>}}
"""

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.0,
                responseMimeType="application/json"
            )
        )

        res_text = response.text.strip() if response.text else "{}"
        parsed = json.loads(res_text)
        matched_id = parsed.get("matched_id")

        if matched_id:
            for mem in candidates:
                if mem.id == matched_id:
                    return mem
    except Exception as e:
        print(f"ℹ️ [Semantic Intent Engine] LLM evaluation skipped: {e}")

    return None

def lookup_memory(db: Session, user_message: str, user_id: Optional[int] = None) -> Optional[QueryMemory]:
    """
    Cheap-First Read Path for Two-Tiered Memory Lookup:
    Level 1: Exact SHA-256 Intent Hash Match (0 ms)
    Level 2: Gemini LLM Semantic Intent Evaluator (Phrasing Invariance e.g. 'who is the user' vs 'what the user name')

    Prioritization:
    1. User-Specific Scope (user_id == current_user.id)
    2. Shared Agent Scope (user_id == None)
    """
    if not user_message:
        return None

    target_hash = compute_intent_hash(user_message)

    # ── Priority 1: User-Specific Scope ─────────────────────────────────────
    if user_id:
        user_memories = db.query(QueryMemory).filter(
            QueryMemory.user_id == user_id,
            QueryMemory.is_pii_clean == True
        ).all()

        # Level 1: Exact SHA-256 Hash Hit
        for mem in user_memories:
            if mem.intent_hash == target_hash:
                print(f"🎯 [Memory Lookup] HIT (Exact Hash): User-Specific Memory (ID: {mem.id})")
                mem.usage_count += 1
                db.commit()
                # Apply dynamic runtime parameter binding
                mem.sql_template = bind_runtime_parameters(mem.sql_template, user_id)
                return mem

        # Level 2: Gemini LLM Semantic Intent Matcher
        matched_user_mem = evaluate_semantic_intent(user_message, user_memories)
        if matched_user_mem:
            print(f"🎯 [Memory Lookup] HIT (Semantic Intent Engine): User-Specific Memory (ID: {matched_user_mem.id})")
            matched_user_mem.usage_count += 1
            db.commit()
            matched_user_mem.sql_template = bind_runtime_parameters(matched_user_mem.sql_template, user_id)
            return matched_user_mem

    # ── Priority 2: Shared Agent Scope ──────────────────────────────────────
    shared_memories = db.query(QueryMemory).filter(
        QueryMemory.user_id == None,
        QueryMemory.is_pii_clean == True
    ).all()

    # Level 1: Exact SHA-256 Hash Hit
    for mem in shared_memories:
        if mem.intent_hash == target_hash:
            print(f"🌐 [Memory Lookup] HIT (Exact Hash): Shared Agent Memory (ID: {mem.id})")
            mem.usage_count += 1
            db.commit()
            mem.sql_template = bind_runtime_parameters(mem.sql_template, user_id)
            return mem

    # Level 2: Gemini LLM Semantic Intent Matcher
    matched_shared_mem = evaluate_semantic_intent(user_message, shared_memories)
    if matched_shared_mem:
        print(f"🌐 [Memory Lookup] HIT (Semantic Intent Engine): Shared Agent Memory (ID: {matched_shared_mem.id})")
        matched_shared_mem.usage_count += 1
        db.commit()
        matched_shared_mem.sql_template = bind_runtime_parameters(matched_shared_mem.sql_template, user_id)
        return matched_shared_mem

    return None
