import os
from PIL import Image, ImageDraw, ImageFont

def draw_diagram():
    os.makedirs("docs", exist_ok=True)
    width, height = 1200, 750
    img = Image.new("RGB", (width, height), color="#020617")
    draw = ImageDraw.Draw(img)

    # Try loading default font
    try:
        font_title = ImageFont.truetype("DejaVuSans-Bold.ttf", 24)
        font_header = ImageFont.truetype("DejaVuSans-Bold.ttf", 16)
        font_body = ImageFont.truetype("DejaVuSans.ttf", 13)
        font_small = ImageFont.truetype("DejaVuSans-Oblique.ttf", 11)
    except Exception:
        font_title = font_header = font_body = font_small = ImageFont.load_default()

    # Draw Title Header
    draw.rectangle([0, 0, width, 70], fill="#0f172a")
    draw.text((30, 20), "ENTERPRISE AI DATABASE ASSISTANT — ARCHITECTURE OVERVIEW", fill="#38bdf8", font=font_title)

    # Box 1: Frontend & Auth Layer
    draw.rounded_rectangle([40, 100, 320, 350], radius=15, fill="#0f172a", outline="#1e293b", width=2)
    draw.text((60, 115), "1. Frontend Layer (Next.js)", fill="#60a5fa", font=font_header)
    draw.text((60, 150), "• Unified Dark Slate UI (bg-slate-950)\n• Conversational History Drawer\n• Quick Prompt Cards & CSV Export\n• Zustand Auth Store (isInitialized)\n• Protected & Admin Route Guards", fill="#94a3b8", font=font_body)

    # Box 2: Node 0 Memory Engine
    draw.rounded_rectangle([370, 100, 810, 230], radius=15, fill="#0f172a", outline="#059669", width=2)
    draw.text((390, 115), "2. Node 0: Two-Tiered Memory Engine ($0 Cost)", fill="#34d399", font=font_header)
    draw.text((390, 150), "• Level 1: SHA-256 Intent Hash Match (0ms)\n• Level 2: Gemini LLM Semantic Intent Decision Engine\n• Scopes: User-Specific (user_id=X) & Shared (user_id=NULL)", fill="#94a3b8", font=font_body)

    # Box 3: LangGraph Reasoning Flow (Nodes 1-4)
    draw.rounded_rectangle([370, 260, 810, 520], radius=15, fill="#0f172a", outline="#3b82f6", width=2)
    draw.text((390, 275), "3. LangGraph StateGraph Reasoning Loop", fill="#60a5fa", font=font_header)
    draw.text((390, 310), "• Node 1 (schema_inspector): Context & RBAC Setup\n• Node 2 (llm_reasoner): Gemini 3.5 Flash Query Gen\n• Node 3 (mcp_tool_execution): FastMCP SELECT Execution\n• Node 4 (response_synthesizer): Output Compilation", fill="#94a3b8", font=font_body)

    # Box 4: Asynchronous Sleep Agent
    draw.rounded_rectangle([40, 380, 320, 690], radius=15, fill="#0f172a", outline="#a855f7", width=2)
    draw.text((60, 395), "4. Async Sleep Agent Builder", fill="#c084fc", font=font_header)
    draw.text((60, 430), "• BackgroundTasks Pipeline\n• Watermark Gating & Deduplication\n• Privacy Gate (scrub_pii REDACTION)\n• Gemini Template Abstraction\n• Persists into query_memories DB", fill="#94a3b8", font=font_body)

    # Box 5: FastMCP & PostgreSQL DB
    draw.rounded_rectangle([860, 100, 1160, 690], radius=15, fill="#0f172a", outline="#f59e0b", width=2)
    draw.text((880, 115), "5. Data & Security Layer", fill="#fbbf24", font=font_header)
    draw.text((880, 150), "FastMCP Tool Protocols:\n• list_tables (RBAC)\n• describe_table\n• execute_query (SELECT Only)\n• get_schema_summary\n\nDatabase Tables:\n• customers & orders\n• order_items & products\n• categories & reviews\n• audit_logs & query_memories\n• users & role_permissions", fill="#94a3b8", font=font_body)

    # Draw Arrows / Connections
    # Arrow Frontend -> Memory Engine
    draw.line([320, 160, 370, 160], fill="#3b82f6", width=3)
    # Arrow Memory -> Graph Reasoning
    draw.line([590, 230, 590, 260], fill="#34d399", width=3)
    # Arrow Graph Reasoning -> Data Layer
    draw.line([810, 390, 860, 390], fill="#f59e0b", width=3)
    # Arrow Graph Reasoning -> Sleep Agent
    draw.line([370, 440, 320, 440], fill="#c084fc", width=3)

    # Footer
    draw.rectangle([0, 710, width, height], fill="#0f172a")
    draw.text((30, 720), "Enterprise AI Database Assistant • LangGraph + FastMCP + Memory Architecture", fill="#64748b", font=font_small)

    out_path = "docs/architecture_diagram.png"
    img.save(out_path)
    print(f"✅ Architecture diagram saved successfully to '{out_path}'!")

if __name__ == "__main__":
    draw_diagram()
