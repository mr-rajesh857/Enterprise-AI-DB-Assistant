from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.models import User, Role, Permission, AuditLog, ChatSession, ChatMessage, QueryMemory
from app.routers import auth, query, users, roles, admin, chats, admin_memory
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enterprise AI DB Assistant", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router,         prefix="/api/auth",  tags=["Auth"])
app.include_router(query.router,        prefix="/api/query", tags=["Query"])
app.include_router(chats.router,        prefix="/api",       tags=["Chats"])
app.include_router(admin_memory.router, prefix="/api",       tags=["Memory"])
app.include_router(users.router,        prefix="/api/admin", tags=["Admin"])
app.include_router(roles.router,        prefix="/api/admin", tags=["Admin"])
app.include_router(admin.router,        prefix="/api/admin", tags=["Admin"])

@app.get("/api")
def root(): return {"status": "ok", "message": "AI DB Assistant API v1.0"}

@app.get("/api/health")
def health(): return {"status": "healthy"}



# Path to the frontend export directory
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "out")

if os.path.exists(frontend_dist):
    # Mount the _next static assets directory
    next_assets = os.path.join(frontend_dist, "_next")
    if os.path.exists(next_assets):
        app.mount("/_next", StaticFiles(directory=next_assets), name="next")
        
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_frontend(full_path: str):
        # API requests should not fall through to the frontend catch-all
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        # Try to serve the exact file (e.g., favicon.ico)
        target_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(target_path):
            return FileResponse(target_path)
        
        # Try to serve the .html equivalent (Next.js static export routing)
        html_path = target_path + ".html"
        if os.path.isfile(html_path):
            return FileResponse(html_path)
            
        # Fallback to index.html (or 404.html if you prefer, but index works for 404 in SPA)
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
            if full_path == "" or full_path == "/":
                return FileResponse(index_path)
            
            # Next.js static export creates a 404.html for missing pages
            not_found = os.path.join(frontend_dist, "404.html")
            if os.path.isfile(not_found):
                return FileResponse(not_found)
                
            return FileResponse(index_path)
            
        return {"error": "Frontend not built"}