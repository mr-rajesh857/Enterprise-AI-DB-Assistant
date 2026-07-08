from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas import QueryRequest, QueryResponse
from app.services.auth_service import get_current_user
from app.services.rbac_service import get_allowed_tables, can_execute_query
from app.services.ai_agent import AIAgent
from app.mcp_tools.sql_tools import list_tables

router = APIRouter()

@router.post("/chat", response_model=QueryResponse)
async def chat(body: QueryRequest, request: Request,
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

    agent = AIAgent(allowed_tables=allowed_tables)
    result = agent.run(body.message, body.conversation_history or [])
    log.sql_query = result.get("sql")
    log.status = result.get("status", "success")
    log.row_count = result.get("row_count")
    log.action = "query_executed"
    db.commit()
    return QueryResponse(**result)

@router.get("/tables")
def tables(current_user: User = Depends(get_current_user)):
    allowed = get_allowed_tables(current_user)
    return list_tables(allowed)