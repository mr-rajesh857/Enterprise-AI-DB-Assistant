from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas import LoginRequest, TokenResponse
from app.services.auth_service import verify_password, create_access_token, get_current_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user credentials and issue JWT access token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated. Contact admin."
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.name})

    # Record login event in audit logs
    audit_entry = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="user_login",
        natural_language="User logged in successfully",
        status="success"
    )
    db.add(audit_entry)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.name,
            "allowed_tables": user.allowed_tables
        }
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch profile details for the authenticated user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.name,
        "allowed_tables": current_user.allowed_tables,
        "is_active": current_user.is_active
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log out current user and record audit entry."""
    audit_entry = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="user_logout",
        natural_language="User logged out",
        status="success"
    )
    db.add(audit_entry)
    db.commit()

    return {"message": "Successfully logged out"}