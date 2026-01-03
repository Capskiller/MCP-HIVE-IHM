"""Models management endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_ollama_client
from app.services.llm.ollama_client import OllamaClient

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("")
async def list_models(
    ollama: OllamaClient = Depends(get_ollama_client),
) -> dict:
    """List all available models."""
    try:
        models = await ollama.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama unavailable: {e}")


@router.get("/installed")
async def list_installed_models(
    ollama: OllamaClient = Depends(get_ollama_client),
) -> dict:
    """List installed models only."""
    try:
        models = await ollama.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama unavailable: {e}")


@router.get("/{model_name:path}")
async def get_model_info(
    model_name: str,
    ollama: OllamaClient = Depends(get_ollama_client),
) -> dict:
    """Get model details."""
    try:
        return await ollama.show_model(model_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{model_name:path}/pull")
async def pull_model(
    model_name: str,
    ollama: OllamaClient = Depends(get_ollama_client),
) -> EventSourceResponse:
    """Pull/download a model with streaming progress."""

    async def progress_generator():
        try:
            async for progress in ollama.pull_model(model_name):
                yield {"data": str(progress)}
        except Exception as e:
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(progress_generator())
