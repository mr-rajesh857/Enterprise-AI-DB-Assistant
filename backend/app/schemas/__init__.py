from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class PermissionOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[PermissionOut] = []
    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    role: RoleOut
    allowed_tables: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_id: int
    allowed_tables: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None
    allowed_tables: Optional[str] = None

class QueryRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []

class QueryResponse(BaseModel):
    answer: str
    sql: Optional[str] = None
    columns: Optional[List[str]] = None
    rows: Optional[List[dict]] = None
    row_count: Optional[int] = None
    status: str = "success"