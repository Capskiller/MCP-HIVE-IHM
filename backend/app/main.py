"""MCP-HIVE-SmartHub - FastAPI Application Entry Point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.api.router import api_router
from app.api.deps import init_dependencies
from app.services.mcp.manager import MCPManager
from app.services.llm.ollama_client import OllamaClient
from app.services.chat.conversation import ConversationManager

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info(f"Starting MCP-HIVE-SmartHub v{__version__}")

    # Initialize services
    mcp_manager = MCPManager()
    ollama_client = OllamaClient()
    conversation_manager = ConversationManager()

    # Initialize MCP connections
    await mcp_manager.initialize()

    # Store in app state for cleanup
    app.state.mcp_manager = mcp_manager
    app.state.ollama_client = ollama_client
    app.state.conversation_manager = conversation_manager

    # Initialize dependencies for injection
    init_dependencies(mcp_manager, ollama_client, conversation_manager)

    logger.info("All services initialized")

    yield

    # Shutdown
    logger.info("Shutting down services...")
    await mcp_manager.shutdown()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="MCP-HIVE-SmartHub",
        version=__version__,
        description="AI-powered orchestrator for Hive databases via MCP (Model Context Protocol)",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router)

    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": "MCP-HIVE-SmartHub",
            "version": __version__,
            "status": "running",
            "docs": "/docs",
        }

    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
