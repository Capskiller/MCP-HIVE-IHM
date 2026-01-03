"""Chat endpoints with SSE streaming support."""

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_chat_orchestrator
from app.api.schemas.chat import ChatRequest, ChatResponse
from app.services.chat.orchestrator import ChatOrchestrator

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
) -> ChatResponse:
    """Single-turn chat with tool calling.

    Returns complete response after all tool executions.
    """
    return await orchestrator.chat(request)


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
) -> EventSourceResponse:
    """Streaming chat with SSE events.

    Events:
    - content: Token-by-token response text
    - tool_call: When LLM invokes a tool (includes mcp_server)
    - tool_result: Tool execution result with timing
    - done: Final metadata (tokens, duration)
    - error: Error occurred
    """

    async def event_generator():
        try:
            async for event in orchestrator.chat_stream(request):
                yield {
                    "event": event.type,
                    "data": event.model_dump_json(),
                }
        except Exception as e:
            yield {
                "event": "error",
                "data": f'{{"code": "STREAM_ERROR", "message": "{str(e)}"}}',
            }
        finally:
            yield {"data": "[DONE]"}

    return EventSourceResponse(
        event_generator(),
        headers={
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Cache-Control": "no-cache",
        },
    )


@router.get("/{conversation_id}/history")
async def get_history(
    conversation_id: str,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
) -> dict:
    """Get conversation history."""
    history = orchestrator.conversations.get_history(conversation_id)
    if not history:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return history


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
) -> dict:
    """Delete a conversation."""
    if orchestrator.conversations.delete(conversation_id):
        return {"status": "deleted", "conversation_id": conversation_id}
    raise HTTPException(status_code=404, detail="Conversation not found")


@router.get("/conversations")
async def list_conversations(
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
) -> dict:
    """List all conversations."""
    return {"conversations": orchestrator.conversations.list_conversations()}
