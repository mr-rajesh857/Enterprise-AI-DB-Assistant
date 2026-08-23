from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas import ChatSessionOut, ChatMessageOut, ChatSessionCreate
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/chats", response_model=List[ChatSessionOut])
def get_chat_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch all chat sessions for the current user."""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()
    results = []
    for s in sessions:
        results.append(ChatSessionOut(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            messages_count=len(s.messages)
        ))
    return results

@router.post("/chats", response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_chat_session(data: ChatSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new chat session."""
    session = ChatSession(user_id=current_user.id, title=data.title or "New Conversation")
    db.add(session)
    db.commit()
    db.refresh(session)
    return ChatSessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages_count=0
    )

@router.get("/chats/{session_id}", response_model=List[ChatMessageOut])
def get_chat_messages(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch message history for a specific chat session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    out = []
    for m in messages:
        out.append(ChatMessageOut(
            id=m.id,
            session_id=m.session_id,
            role=m.role,
            content=m.content,
            sql=m.sql_query,
            columns=m.columns,
            rows=m.rows,
            row_count=m.row_count,
            status=m.status,
            created_at=m.created_at
        ))
    return out

@router.delete("/chats/{session_id}")
def delete_chat_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a chat session and its messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted successfully"}
