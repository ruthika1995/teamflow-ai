import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.session import Base, engine
from app.database.seed import seed_database
from app.websocket.manager import manager

from app.api.auth import router as auth_router
from app.api.workspaces import router as workspaces_router
from app.api.projects import router as projects_router
from app.api.tasks import router as tasks_router
from app.api.chat import router as chat_router
from app.api.meetings import router as meetings_router
from app.api.ai import router as ai_router
from app.api.notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables & run seed data on startup
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-Time Full-Stack Project Management Platform with OpenRouter AI Copilot",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(workspaces_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(tasks_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(meetings_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

# Real-Time WebSocket Endpoint
@app.websocket("/ws/workspace/{workspace_id}")
async def websocket_workspace_endpoint(
    websocket: WebSocket,
    workspace_id: str,
    user_id: str = Query(default="anonymous")
):
    await manager.connect(websocket, workspace_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f'{{"type": "PONG", "data": {{"echo": true}}}}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY)
    }

# Mount Frontend static files for single-origin unified deployment (Render)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path in ["docs", "openapi.json", "redoc", "health"]:
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": f"Welcome to {settings.PROJECT_NAME} API"}
else:
    @app.get("/")
    def root():
        return {
            "message": f"Welcome to {settings.PROJECT_NAME} API",
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR
        }
