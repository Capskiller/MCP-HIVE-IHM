"""Health check endpoints."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.schemas.health import HealthResponse, ComponentStatus
from app.api.deps import get_mcp_manager, get_ollama_client
from app.services.mcp.manager import MCPManager
from app.services.llm.ollama_client import OllamaClient

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
async def health(
    mcp_manager: MCPManager = Depends(get_mcp_manager),
    ollama_client: OllamaClient = Depends(get_ollama_client),
) -> HealthResponse:
    """Aggregated health of all components."""
    # Check Ollama
    ollama_healthy = await ollama_client.is_healthy()

    # Check MCP servers
    mcp_status = await mcp_manager.get_health_status()

    components = {
        "ollama": ComponentStatus(
            status="healthy" if ollama_healthy else "unhealthy",
            details={"base_url": ollama_client.base_url},
        ),
    }

    for name, status in mcp_status.items():
        components[f"mcp:{name}"] = ComponentStatus(
            status="healthy" if status["connected"] else "unhealthy",
            details=status,
        )

    # Determine overall status
    all_healthy = ollama_healthy and all(
        s["connected"] for s in mcp_status.values()
    )
    has_mcp_issues = not all(s["connected"] for s in mcp_status.values())

    if not ollama_healthy:
        overall_status = "unhealthy"
    elif has_mcp_issues:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    return HealthResponse(
        status=overall_status,
        components=components,
    )


@router.get("/live")
async def liveness() -> dict:
    """Kubernetes liveness probe."""
    return {"status": "ok"}


@router.get("/ready")
async def readiness(
    mcp_manager: MCPManager = Depends(get_mcp_manager),
    ollama_client: OllamaClient = Depends(get_ollama_client),
) -> JSONResponse:
    """Kubernetes readiness probe."""
    ollama_healthy = await ollama_client.is_healthy()

    if not ollama_healthy:
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "reason": "Ollama unavailable"},
        )

    mcp_status = await mcp_manager.get_health_status()
    if not any(s["connected"] for s in mcp_status.values()):
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "reason": "No MCP servers connected"},
        )

    return JSONResponse(
        status_code=200,
        content={"status": "ready"},
    )
