import json
from datetime import datetime
from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.chat import ChatSession, ChatMessage
from app.schemas import QueryRequest, QueryResponse
from app.services.auth_service import get_current_user
from app.services.rbac_service import get_allowed_tables, can_execute_query
from app.services.ai_agent import AIAgent
from app.mcp_tools.sql_tools import list_tables
from app.services.memory_builder import run_memory_builder_cycle

router = APIRouter()

@router.post("/chat", response_model=QueryResponse)
async def chat(body: QueryRequest, request: Request,
               background_tasks: BackgroundTasks,
               db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    allowed_tables = get_allowed_tables(current_user)
    log = AuditLog(user_id=current_user.id, action="query_request",
                   natural_language=body.message,
                   ip_address=request.client.host if request.client else "unknown",
                   status="processing")
    db.add(log); db.commit()

    if not can_execute_query(current_user):
        log.status = "blocked"; db.commit()
        return QueryResponse(
            answer="Your role does not have permission to execute queries.",
            status="blocked")

    # Resolve or create ChatSession in DB
    session = None
    if body.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == body.session_id, ChatSession.user_id == current_user.id).first()
    
    if not session:
        # Create new session title from first 40 chars of message
        title_summary = body.message[:40] + ("..." if len(body.message) > 40 else "")
        session = ChatSession(user_id=current_user.id, title=title_summary)
        db.add(session)
        db.commit()
        db.refresh(session)
    elif session.title == "New Conversation":
        session.title = body.message[:40] + ("..." if len(body.message) > 40 else "")
        session.updated_at = datetime.utcnow()
        db.commit()

    # Load conversation history from DB or payload
    history_from_db = []
    past_messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at.asc()).all()
    for m in past_messages:
        history_from_db.append({"role": m.role, "content": m.content})
    
    conversation_history = history_from_db if history_from_db else (body.conversation_history or [])

    # Save incoming user message
    user_msg_record = ChatMessage(
        session_id=session.id,
        role="user",
        content=body.message
    )
    db.add(user_msg_record)
    db.commit()

    # Run LangGraph AI Agent
    agent = AIAgent(allowed_tables=allowed_tables, user_id=current_user.id)
    result = agent.run(body.message, conversation_history)

    # Check if query returned error or missing SQL
    res_status = result.get("status", "success")
    res_answer = result.get("answer", "")

    if not result.get("sql") and res_status == "success" and not res_answer:
        res_status = "error"
        res_answer = "No SQL query could be generated for this request. Please verify your prompt."

    # Save assistant response message to DB
    columns_json_str = json.dumps(result.get("columns"), default=str) if result.get("columns") is not None else None
    rows_json_str = json.dumps(result.get("rows"), default=str) if result.get("rows") is not None else None

    assistant_msg_record = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=res_answer,
        sql_query=result.get("sql"),
        columns_json=columns_json_str,
        rows_json=rows_json_str,
        row_count=result.get("row_count"),
        status=res_status
    )
    db.add(assistant_msg_record)
    session.updated_at = datetime.utcnow()

    log.sql_query = result.get("sql")
    log.status = res_status
    log.row_count = result.get("row_count")
    log.action = "query_executed"
    db.commit()

    # Automatically trigger background Sleep Agent Memory Builder on successful queries
    if res_status == "success" and result.get("sql"):
        background_tasks.add_task(run_memory_builder_cycle, 200)

    return QueryResponse(
        answer=res_answer,
        session_id=session.id,
        sql=result.get("sql"),
        columns=result.get("columns"),
        rows=result.get("rows"),
        row_count=result.get("row_count"),
        status=res_status
    )

@router.get("/tables")
def tables(current_user: User = Depends(get_current_user)):
    allowed = get_allowed_tables(current_user)
    return list_tables(allowed)