"""Async Ollama client with tool calling support."""

import logging
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Dict, List, Optional

from ollama import AsyncClient

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ChatChunk:
    """Represents a chunk of streaming response."""

    content: str = ""
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    done: bool = False
    prompt_tokens: int = 0
    completion_tokens: int = 0


@dataclass
class ChatResult:
    """Complete chat response."""

    content: str
    tool_calls: List[Dict[str, Any]]
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class OllamaClient:
    """Async Ollama client with tool calling support."""

    def __init__(self, base_url: Optional[str] = None):
        """Initialize Ollama client.

        Args:
            base_url: Ollama server URL. Defaults to settings value.
        """
        self.base_url = base_url or settings.ollama.base_url
        self._client = AsyncClient(host=self.base_url)

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False,
    ) -> ChatResult | AsyncIterator[ChatChunk]:
        """Send chat request to Ollama.

        Args:
            messages: Conversation messages.
            model: Model name. Defaults to settings value.
            tools: Available tools in Ollama format.
            stream: Whether to stream the response.

        Returns:
            ChatResult if not streaming, AsyncIterator[ChatChunk] if streaming.
        """
        model = model or settings.ollama.default_model

        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "options": {
                "num_ctx": settings.ollama.num_ctx,
                "num_predict": settings.ollama.num_predict,
            },
        }
        if tools:
            kwargs["tools"] = tools

        if stream:
            return self._stream_chat(**kwargs)
        else:
            return await self._sync_chat(**kwargs)

    async def _sync_chat(self, **kwargs: Any) -> ChatResult:
        """Non-streaming chat."""
        response = await self._client.chat(**kwargs)

        tool_calls = []
        if response.message.tool_calls:
            for tc in response.message.tool_calls:
                tool_calls.append({
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                })

        return ChatResult(
            content=response.message.content or "",
            tool_calls=tool_calls,
            prompt_tokens=response.prompt_eval_count or 0,
            completion_tokens=response.eval_count or 0,
            total_tokens=(response.prompt_eval_count or 0) + (response.eval_count or 0),
        )

    async def _stream_chat(self, **kwargs: Any) -> AsyncIterator[ChatChunk]:
        """Streaming chat with tool call detection."""
        async for chunk in await self._client.chat(**kwargs, stream=True):
            message = chunk.get("message", {})

            tool_calls = []
            if message.get("tool_calls"):
                for tc in message["tool_calls"]:
                    tool_calls.append({
                        "name": tc["function"]["name"],
                        "arguments": tc["function"]["arguments"],
                    })

            # Extract token counts from final chunk
            is_done = chunk.get("done", False)
            prompt_tokens = 0
            completion_tokens = 0
            if is_done:
                prompt_tokens = chunk.get("prompt_eval_count", 0) or 0
                completion_tokens = chunk.get("eval_count", 0) or 0

            yield ChatChunk(
                content=message.get("content", ""),
                tool_calls=tool_calls,
                done=is_done,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )

    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models."""
        models = await self._client.list()
        return [
            {
                "name": m.model,
                "size": m.size,
                "modified_at": str(m.modified_at) if m.modified_at else None,
                "digest": m.digest,
            }
            for m in models.models
        ]

    async def pull_model(self, name: str) -> AsyncIterator[Dict[str, Any]]:
        """Pull/download a model with progress streaming."""
        async for progress in await self._client.pull(name, stream=True):
            yield {
                "status": progress.get("status", ""),
                "digest": progress.get("digest"),
                "total": progress.get("total"),
                "completed": progress.get("completed"),
            }

    async def show_model(self, name: str) -> Dict[str, Any]:
        """Get model details."""
        info = await self._client.show(name)
        return {
            "modelfile": info.modelfile,
            "parameters": info.parameters,
            "template": info.template,
            "details": info.details.model_dump() if info.details else {},
        }

    async def is_healthy(self) -> bool:
        """Check if Ollama is reachable."""
        try:
            await self._client.list()
            return True
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False
