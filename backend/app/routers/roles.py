from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.role import Role
from app.schemas import RoleOut, RoleCreate
from app.services.auth_service import require_admin

router = APIRouter()

@router.get("/roles", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Role).all()

@router.post("/roles", response_model=RoleOut, status_code=201)
def create_role(data: RoleCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(Role).filter(Role.name == data.name).first():
        raise HTTPException(400, "Role already exists")
    role = Role(name=data.name, description=data.description)
    db.add(role); db.commit(); db.refresh(role)
    return role