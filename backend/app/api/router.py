"""Main API router aggregator."""

from fastapi import APIRouter

from app.api.routes import health, models, chat, mcp_servers

api_router = APIRouter()

# Include all route modules
api_router.include_router(health.router)
api_router.include_router(models.router)
api_router.include_router(chat.router)
api_router.include_router(mcp_servers.router)
