from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
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
            # Keep-alive or handle incoming messages directly over socket
            data = await websocket.receive_text()
            # Echo or process if needed
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
        "database": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql"
    }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
