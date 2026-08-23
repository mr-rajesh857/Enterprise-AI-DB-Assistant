from fastapi import HTTPException
from app.models.user import User
from typing import Optional, List

def check_permission(user: User, permission: str):
    allowed = [p.name for p in user.role.permissions]
    if permission not in allowed:
        raise HTTPException(status_code=403,
            detail=f"Role '{user.role.name}' lacks permission '{permission}'")

def get_allowed_tables(user: User) -> Optional[List[str]]:
    """Returns None for admin (unrestricted), list for others."""
    if user.role.name == "admin":
        return None
    return user.get_allowed_tables_list()

def can_execute_query(user: User) -> bool:
    return "query:execute" in [p.name for p in user.role.permissions]