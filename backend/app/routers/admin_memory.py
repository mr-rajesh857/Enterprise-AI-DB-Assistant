from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.memory import QueryMemory
from app.services.auth_service import require_admin
from app.services.memory_builder import run_memory_builder_cycle

router = APIRouter()

@router.post("/admin/memory/build")
def trigger_memory_build(limit: int = 200, current_user: User = Depends(require_admin)):
    """
    Manually or asynchronously triggers the Sleep Agent Memory Builder cycle.
    Enforces Watermark Gating, SHA-256 Deduplication, and PII Privacy Scanning.
    """
    result = run_memory_builder_cycle(batch_limit=limit)
    return result

@router.get("/admin/memory/stats")
def get_memory_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """
    Returns statistics on stored QueryMemories (User vs Shared scopes, PII clean count).
    """
    total_memories = db.query(QueryMemory).count()
    shared_memories = db.query(QueryMemory).filter(QueryMemory.user_id == None).count()
    user_memories = db.query(QueryMemory).filter(QueryMemory.user_id != None).count()
    pii_clean = db.query(QueryMemory).filter(QueryMemory.is_pii_clean == True).count()

    return {
        "total_memories": total_memories,
        "shared_scope_memories": shared_memories,
        "user_scope_memories": user_memories,
        "pii_clean_memories": pii_clean
    }
