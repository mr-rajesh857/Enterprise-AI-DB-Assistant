import json
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class QueryMemory(Base):
    __tablename__ = "query_memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = Shared Agent scope; Integer = User-Specific scope
    intent_hash = Column(String(64), index=True, nullable=False)      # SHA-256 hash for fast deduplication
    canonical_question = Column(String(500), nullable=False)           # Generic value-agnostic pattern
    sql_template = Column(Text, nullable=False)                      # Parameterized SQL query template
    sample_question = Column(Text, nullable=True)                    # Original reference question
    is_pii_clean = Column(Boolean, default=True)                      # Compliance & privacy verification flag
    usage_count = Column(Integer, default=1)                         # Frequency tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="query_memories")
