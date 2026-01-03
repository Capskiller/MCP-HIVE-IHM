"""FastAPI dependency injection."""

from typing import Optional

from app.services.mcp.manager import MCPManager
from app.services.llm.ollama_client import OllamaClient
from app.services.chat.orchestrator import ChatOrchestrator
from app.services.chat.conversation import ConversationManager

# Global instances (initialized on startup)
_mcp_manager: Optional[MCPManager] = None
_ollama_client: Optional[OllamaClient] = None
_conversation_manager: Optional[ConversationManager] = None
_chat_orchestrator: Optional[ChatOrchestrator] = None


def init_dependencies(
    mcp_manager: MCPManager,
    ollama_client: OllamaClient,
    conversation_manager: ConversationManager,
) -> None:
    """Initialize global dependencies.

    Called during app startup.
    """
    global _mcp_manager, _ollama_client, _conversation_manager, _chat_orchestrator

    _mcp_manager = mcp_manager
    _ollama_client = ollama_client
    _conversation_manager = conversation_manager
    _chat_orchestrator = ChatOrchestrator(
        mcp_manager=mcp_manager,
        ollama_client=ollama_client,
        conversation_manager=conversation_manager,
    )


def get_mcp_manager() -> MCPManager:
    """Get MCP manager instance."""
    if _mcp_manager is None:
        raise RuntimeError("MCP Manager not initialized")
    return _mcp_manager


def get_ollama_client() -> OllamaClient:
    """Get Ollama client instance."""
    if _ollama_client is None:
        raise RuntimeError("Ollama client not initialized")
    return _ollama_client


def get_conversation_manager() -> ConversationManager:
    """Get conversation manager instance."""
    if _conversation_manager is None:
        raise RuntimeError("Conversation manager not initialized")
    return _conversation_manager


def get_chat_orchestrator() -> ChatOrchestrator:
    """Get chat orchestrator instance."""
    if _chat_orchestrator is None:
        raise RuntimeError("Chat orchestrator not initialized")
    return _chat_orchestrator
