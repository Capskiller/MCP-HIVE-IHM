"""Chat API schemas."""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field

from app.api.schemas.mcp import ToolExecution  # Re-export for convenience


class TokenUsage(BaseModel):
    """Token usage statistics."""

    prompt: int = 0
    completion: int = 0
    total: int = 0


class ChatRequest(BaseModel):
    """Chat request payload."""

    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[str] = None
    model: Optional[str] = None
    stream: bool = False

    # Extensibility for future features
    enable_rag: bool = False
    rag_sources: List[str] = Field(default_factory=list)
    sub_agents: List[str] = Field(default_factory=list)
    enabled_mcp_servers: Optional[List[str]] = None  # None = all enabled


class ChatResponse(BaseModel):
    """Chat response payload."""

    content: str
    conversation_id: str
    model: str
    tools_used: List[str]
    tool_executions: List[ToolExecution]
    total_duration_ms: int
    tokens: TokenUsage
    status: Literal["processing", "completed", "error"]


# ===========================================
# SSE Stream Events
# ===========================================


class StreamContentEvent(BaseModel):
    """Content token event."""

    type: Literal["content"] = "content"
    content: str


class StreamToolCallEvent(BaseModel):
    """Tool call initiated event."""

    type: Literal["tool_call"] = "tool_call"
    tool_call: Dict[str, Any]  # {id, name, arguments, mcp_server}


class StreamToolResultEvent(BaseModel):
    """Tool result received event."""

    type: Literal["tool_result"] = "tool_result"
    tool_result: Dict[str, Any]  # {id, name, success, preview, duration_ms}


class StreamDoneEvent(BaseModel):
    """Stream completed event."""

    type: Literal["done"] = "done"
    metadata: Dict[str, Any]  # {conversation_id, model, total_duration_ms, tokens}


class StreamErrorEvent(BaseModel):
    """Stream error event."""

    type: Literal["error"] = "error"
    error: Dict[str, str]  # {code, message}


StreamEvent = Union[
    StreamContentEvent,
    StreamToolCallEvent,
    StreamToolResultEvent,
    StreamDoneEvent,
    StreamErrorEvent,
]
