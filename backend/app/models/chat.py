import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    sql_query = Column(Text, nullable=True)
    columns_json = Column(Text, nullable=True)  # JSON string of column names
    rows_json = Column(Text, nullable=True)     # JSON string of result rows
    row_count = Column(Integer, nullable=True)
    status = Column(String(20), default="success")
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

    @property
    def columns(self):
        if self.columns_json:
            try:
                return json.loads(self.columns_json)
            except Exception:
                return None
        return None

    @property
    def rows(self):
        if self.rows_json:
            try:
                return json.loads(self.rows_json)
            except Exception:
                return None
        return None
