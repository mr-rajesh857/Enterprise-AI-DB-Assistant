from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.models import User, Role, Permission, AuditLog
from app.routers import auth, query, users, roles, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enterprise AI DB Assistant", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router,  prefix="/auth",  tags=["Auth"])
app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(users.router, prefix="/admin", tags=["Admin"])
app.include_router(roles.router, prefix="/admin", tags=["Admin"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

@app.get("/")
def root(): return {"status": "ok", "message": "AI DB Assistant API v1.0"}

@app.get("/health")
def health(): return {"status": "healthy"}