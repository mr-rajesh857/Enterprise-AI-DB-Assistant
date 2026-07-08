from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas import UserOut, UserCreate, UserUpdate
from app.services.auth_service import hash_password, require_admin

router = APIRouter()

@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).all()

@router.post("/users", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    if not db.query(Role).filter(Role.id == data.role_id).first():
        raise HTTPException(404, "Role not found")
    user = User(email=data.email, hashed_password=hash_password(data.password),
                full_name=data.full_name, role_id=data.role_id,
                allowed_tables=data.allowed_tables)
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate,
                db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(404, "User not found")
    if data.full_name is not None: user.full_name = data.full_name
    if data.is_active is not None: user.is_active = data.is_active
    if data.role_id is not None:
        if not db.query(Role).filter(Role.id == data.role_id).first():
            raise HTTPException(404, "Role not found")
        user.role_id = data.role_id
    if data.allowed_tables is not None: user.allowed_tables = data.allowed_tables
    db.commit(); db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(404, "User not found")
    if user.id == admin.id: raise HTTPException(400, "Cannot delete your own account")
    db.delete(user); db.commit()
    return {"message": "User deleted"}