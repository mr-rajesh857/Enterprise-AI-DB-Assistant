from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas import LoginRequest, TokenResponse
from app.services.auth_service import verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated. Contact admin.")
    token = create_access_token({"sub": str(user.id), "role": user.role.name})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": user.id, "email": user.email,
                 "full_name": user.full_name, "role": user.role.name,
                 "allowed_tables": user.allowed_tables}
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email,
            "full_name": current_user.full_name, "role": current_user.role.name,
            "allowed_tables": current_user.allowed_tables, "is_active": current_user.is_active}