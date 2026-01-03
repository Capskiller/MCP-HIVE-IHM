"""Chat Orchestrator - Main chat logic with tool calling."""

import logging
import uuid
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Optional

from app.config import settings
from app.services.mcp.manager import MCPManager
from app.services.llm.ollama_client import OllamaClient
from app.services.llm.tool_converter import mcp_tools_to_ollama_format
from app.services.chat.conversation import ConversationManager
from app.api.schemas.chat import (
    ChatRequest,
    ChatResponse,
    StreamContentEvent,
    StreamToolCallEvent,
    StreamToolResultEvent,
    StreamDoneEvent,
    StreamErrorEvent,
    TokenUsage,
)
from app.api.schemas.mcp import ToolExecution

logger = logging.getLogger(__name__)

# System prompt for the LLM agent
SYSTEM_PROMPT = """Tu es un assistant expert en analyse de données connecté à une base Hive.

IMPORTANT - Méthodologie de travail:
1. Tu ne connais PAS le schéma des tables à l'avance
2. AVANT toute requête SQL, tu DOIS explorer le schéma:
   - Utilise list_tables pour voir les tables disponibles
   - Utilise get_table_schema pour comprendre les colonnes d'une table
   - Utilise get_sample_data si tu as besoin de voir des exemples de valeurs
3. Tu construis tes requêtes SQL UNIQUEMENT à partir des informations découvertes
4. Tu utilises execute_query pour exécuter tes requêtes HiveQL

Règles SQL Hive:
- Pas de point-virgule à la fin des requêtes
- Utilise les noms de colonnes EXACTS découverts via get_table_schema
- Limite toujours les résultats (LIMIT) pour éviter les surcharges

Tu réponds en français de manière claire et structurée."""

StreamEvent = (
    StreamContentEvent
    | StreamToolCallEvent
    | StreamToolResultEvent
    | StreamDoneEvent
    | StreamErrorEvent
)


class ChatOrchestrator:
    """Orchestrates the chat flow with tool execution.

    1. Receive user message
    2. Build context with conversation history
    3. Send to LLM with available tools
    4. Execute tool calls via MCP
    5. Continue until LLM produces final response
    """

    def __init__(
        self,
        mcp_manager: MCPManager,
        ollama_client: OllamaClient,
        conversation_manager: ConversationManager,
    ):
        """Initialize chat orchestrator.

        Args:
            mcp_manager: MCP manager instance.
            ollama_client: Ollama client instance.
            conversation_manager: Conversation manager instance.
        """
        self.mcp = mcp_manager
        self.llm = ollama_client
        self.conversations = conversation_manager

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Non-streaming chat with tool execution loop.

        Args:
            request: Chat request.

        Returns:
            Chat response.
        """
        start_time = datetime.now()

        # Get or create conversation
        conv_id = request.conversation_id or str(uuid.uuid4())
        messages = self.conversations.get_messages(conv_id)

        # Add system prompt if this is a new conversation
        if not messages:
            messages.append({"role": "system", "content": SYSTEM_PROMPT})

        # Add user message
        messages.append({"role": "user", "content": request.message})
        self.conversations.add_message(conv_id, "user", request.message)

        # Get available tools
        tools = self.mcp.get_all_tools(enabled_only=True)
        ollama_tools = mcp_tools_to_ollama_format(tools) if tools else None

        tool_executions: List[ToolExecution] = []
        total_prompt_tokens = 0
        total_completion_tokens = 0
        final_content = ""

        # Tool execution loop
        max_iterations = settings.conversation.max_tool_iterations
        for iteration in range(max_iterations):
            logger.debug(f"Chat iteration {iteration + 1}/{max_iterations}")

            result = await self.llm.chat(
                messages=messages,
                model=request.model,
                tools=ollama_tools,
            )

            total_prompt_tokens += result.prompt_tokens
            total_completion_tokens += result.completion_tokens

            if not result.tool_calls:
                # No more tools, we have final response
                final_content = result.content
                break

            # Execute tool calls
            for tc in result.tool_calls:
                logger.info(f"Executing tool: {tc['name']}")
                execution = await self.mcp.call_tool(tc["name"], tc["arguments"])
                tool_executions.append(execution)

                # Add tool interaction to messages
                messages.append({
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [{"function": tc}],
                })
                messages.append({
                    "role": "tool",
                    "content": execution.result_preview,
                })
        else:
            final_content = "Maximum tool iterations reached. Please refine your query."
            logger.warning(f"Max iterations reached for conversation {conv_id}")

        # Save assistant response
        self.conversations.add_message(
            conv_id,
            "assistant",
            final_content,
            metadata={
                "tokens": {
                    "prompt": total_prompt_tokens,
                    "completion": total_completion_tokens,
                    "total": total_prompt_tokens + total_completion_tokens,
                },
                "tools_used": [e.name for e in tool_executions],
            },
        )

        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        return ChatResponse(
            content=final_content,
            conversation_id=conv_id,
            model=request.model or settings.ollama.default_model,
            tools_used=[e.name for e in tool_executions],
            tool_executions=tool_executions,
            total_duration_ms=duration_ms,
            tokens=TokenUsage(
                prompt=total_prompt_tokens,
                completion=total_completion_tokens,
                total=total_prompt_tokens + total_completion_tokens,
            ),
            status="completed",
        )

    async def chat_stream(self, request: ChatRequest) -> AsyncIterator[StreamEvent]:
        """Streaming chat with real-time tool execution events.

        Args:
            request: Chat request.

        Yields:
            Stream events.
        """
        start_time = datetime.now()

        conv_id = request.conversation_id or str(uuid.uuid4())
        messages = self.conversations.get_messages(conv_id)

        # Add system prompt if this is a new conversation
        if not messages:
            messages.append({"role": "system", "content": SYSTEM_PROMPT})

        messages.append({"role": "user", "content": request.message})
        self.conversations.add_message(conv_id, "user", request.message)

        tools = self.mcp.get_all_tools(enabled_only=True)
        ollama_tools = mcp_tools_to_ollama_format(tools) if tools else None

        tool_executions: List[ToolExecution] = []
        total_prompt_tokens = 0
        total_completion_tokens = 0
        accumulated_content = ""

        max_iterations = settings.conversation.max_tool_iterations

        try:
            for iteration in range(max_iterations):
                pending_tool_calls: List[Dict[str, Any]] = []

                # Stream LLM response
                async for chunk in await self.llm.chat(
                    messages=messages,
                    model=request.model,
                    tools=ollama_tools,
                    stream=True,
                ):
                    # Stream content tokens
                    if chunk.content:
                        accumulated_content += chunk.content
                        yield StreamContentEvent(
                            type="content",
                            content=chunk.content,
                        )

                    # Collect tool calls
                    if chunk.tool_calls:
                        for tc in chunk.tool_calls:
                            tc_id = str(uuid.uuid4())
                            pending_tool_calls.append({
                                "id": tc_id,
                                **tc,
                            })
                            yield StreamToolCallEvent(
                                type="tool_call",
                                tool_call={
                                    "id": tc_id,
                                    "name": tc["name"],
                                    "arguments": tc["arguments"],
                                    "mcp_server": self._get_server_for_tool(tc["name"]),
                                },
                            )

                    # Capture token counts from final chunk
                    if chunk.done:
                        total_prompt_tokens += chunk.prompt_tokens
                        total_completion_tokens += chunk.completion_tokens

                if not pending_tool_calls:
                    # No tools called, we're done
                    break

                # Execute each tool and stream results
                for tc in pending_tool_calls:
                    execution = await self.mcp.call_tool(tc["name"], tc["arguments"])
                    tool_executions.append(execution)

                    yield StreamToolResultEvent(
                        type="tool_result",
                        tool_result={
                            "id": tc["id"],
                            "name": tc["name"],
                            "success": execution.success,
                            "preview": execution.result_preview,
                            "duration_ms": execution.duration_ms,
                            "mcp_server": execution.server_name,
                        },
                    )

                    # Update messages for next LLM call
                    messages.append({
                        "role": "assistant",
                        "content": "",
                        "tool_calls": [{
                            "function": {
                                "name": tc["name"],
                                "arguments": tc["arguments"],
                            }
                        }],
                    })
                    messages.append({
                        "role": "tool",
                        "content": execution.result_preview,
                    })

            # Save final response
            self.conversations.add_message(
                conv_id,
                "assistant",
                accumulated_content,
                metadata={
                    "tokens": {
                        "prompt": total_prompt_tokens,
                        "completion": total_completion_tokens,
                        "total": total_prompt_tokens + total_completion_tokens,
                    },
                    "tools_used": [e.name for e in tool_executions],
                },
            )

            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            yield StreamDoneEvent(
                type="done",
                metadata={
                    "conversation_id": conv_id,
                    "model": request.model or settings.ollama.default_model,
                    "total_duration_ms": duration_ms,
                    "tokens": {
                        "prompt": total_prompt_tokens,
                        "completion": total_completion_tokens,
                        "total": total_prompt_tokens + total_completion_tokens,
                    },
                },
            )

        except Exception as e:
            logger.exception(f"Stream error: {e}")
            yield StreamErrorEvent(
                type="error",
                error={
                    "code": "STREAM_ERROR",
                    "message": str(e),
                },
            )

    def _get_server_for_tool(self, tool_name: str) -> str:
        """Get the MCP server name for a tool.

        Args:
            tool_name: Tool name.

        Returns:
            Server name or "unknown".
        """
        tools = self.mcp.get_all_tools(enabled_only=False)
        for tool in tools:
            if tool.name == tool_name:
                return tool.server_name
        return "unknown"
