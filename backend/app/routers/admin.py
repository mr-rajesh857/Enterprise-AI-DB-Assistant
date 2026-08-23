from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.services.auth_service import require_admin

router = APIRouter()

@router.get("/audit-logs")
def get_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _=Depends(require_admin)):
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return {"logs": [
        {"id": l.id, "user_id": l.user_id,
         "user_name": l.user.full_name if l.user else "System",
         "user_email": l.user.email if l.user else "-",
         "action": l.action, "natural_language": l.natural_language,
         "sql_query": l.sql_query, "ip_address": l.ip_address,
         "status": l.status, "error_message": l.error_message,
         "row_count": l.row_count,
         "created_at": l.created_at.isoformat()}
        for l in logs
    ], "total": total}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    today = datetime.utcnow().date()
    return {
        "total_users": db.query(func.count(User.id)).scalar(),
        "active_users": db.query(func.count(User.id)).filter(User.is_active == True).scalar(),
        "total_queries": db.query(func.count(AuditLog.id)).filter(AuditLog.action == "query_executed").scalar(),
        "queries_today": db.query(func.count(AuditLog.id)).filter(
            func.date(AuditLog.created_at) == today, AuditLog.action == "query_executed").scalar(),
        "successful": db.query(func.count(AuditLog.id)).filter(AuditLog.status == "success").scalar(),
        "failed": db.query(func.count(AuditLog.id)).filter(AuditLog.status == "error").scalar(),
    }