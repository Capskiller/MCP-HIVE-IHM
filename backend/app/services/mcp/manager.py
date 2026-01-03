"""MCP Manager - Multi-server orchestrator."""

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from mcp.types import Tool, CallToolResult

from app.config import settings, MCPServerConfig
from app.services.mcp.client import MCPClient
from app.api.schemas.mcp import ToolInfo, ToolExecution, MCPServerInfo

logger = logging.getLogger(__name__)


@dataclass
class AggregatedTool:
    """Tool with server origin tracking."""

    tool: Tool
    server_name: str
    server_client: MCPClient


class MCPManager:
    """Orchestrates multiple MCP server connections.

    Aggregates tools from all servers and routes tool calls
    to the appropriate server.
    """

    def __init__(self):
        """Initialize MCP manager."""
        self._clients: Dict[str, MCPClient] = {}
        self._tools_map: Dict[str, AggregatedTool] = {}
        self._enabled_servers: set = set()
        self._lock = asyncio.Lock()

    async def initialize(self, config_file: Optional[str] = None) -> None:
        """Initialize manager and connect to configured servers.

        Args:
            config_file: Path to MCP servers config file.
        """
        config_path = config_file or settings.mcp.config_file
        if not config_path:
            logger.warning("No MCP config file specified, starting without servers")
            return

        try:
            configs = self._load_config(config_path)
            for config in configs:
                if config.enabled:
                    await self.register_server(config)
        except FileNotFoundError:
            logger.warning(f"MCP config file not found: {config_path}")
        except Exception as e:
            logger.error(f"Error loading MCP config: {e}")

    def _load_config(self, config_path: str) -> List[MCPServerConfig]:
        """Load MCP server configurations from file.

        Args:
            config_path: Path to config file.

        Returns:
            List of server configurations.
        """
        path = Path(config_path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(path) as f:
            data = json.load(f)

        servers = data.get("servers", [])
        return [MCPServerConfig(**s) for s in servers]

    async def register_server(self, config: MCPServerConfig) -> bool:
        """Dynamically register a new MCP server.

        Args:
            config: Server configuration.

        Returns:
            True if registration successful.
        """
        async with self._lock:
            if config.name in self._clients:
                logger.warning(f"Server '{config.name}' already registered")
                return False

            client = MCPClient(config)
            try:
                await client.connect()
                self._clients[config.name] = client
                self._enabled_servers.add(config.name)

                # Aggregate tools
                tools = await client.list_tools()
                for tool in tools:
                    # Use tool name as key (may conflict if same name across servers)
                    self._tools_map[tool.name] = AggregatedTool(
                        tool=tool,
                        server_name=config.name,
                        server_client=client,
                    )

                logger.info(f"Registered MCP server '{config.name}' with {len(tools)} tools")
                return True

            except Exception as e:
                logger.error(f"Failed to register server '{config.name}': {e}")
                return False

    async def deregister_server(self, name: str) -> bool:
        """Remove an MCP server.

        Args:
            name: Server name.

        Returns:
            True if deregistration successful.
        """
        async with self._lock:
            if name not in self._clients:
                return False

            await self._clients[name].disconnect()
            del self._clients[name]
            self._enabled_servers.discard(name)

            # Remove tools from this server
            self._tools_map = {
                k: v for k, v in self._tools_map.items()
                if v.server_name != name
            }

            logger.info(f"Deregistered MCP server '{name}'")
            return True

    def toggle_server(self, name: str, enabled: bool) -> bool:
        """Enable or disable a server without disconnecting.

        Args:
            name: Server name.
            enabled: Whether to enable the server.

        Returns:
            True if toggle successful.
        """
        if name not in self._clients:
            return False

        if enabled:
            self._enabled_servers.add(name)
        else:
            self._enabled_servers.discard(name)

        logger.info(f"Server '{name}' {'enabled' if enabled else 'disabled'}")
        return True

    def get_all_tools(self, enabled_only: bool = True) -> List[ToolInfo]:
        """Get aggregated tool list for LLM.

        Args:
            enabled_only: Only include tools from enabled servers.

        Returns:
            List of available tools.
        """
        tools = []
        for agg in self._tools_map.values():
            if enabled_only and agg.server_name not in self._enabled_servers:
                continue

            tools.append(ToolInfo(
                name=agg.tool.name,
                description=agg.tool.description or "",
                input_schema=agg.tool.inputSchema or {},
                server_name=agg.server_name,
            ))

        return tools

    async def call_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> ToolExecution:
        """Route tool call to appropriate MCP server.

        Args:
            tool_name: Tool name.
            arguments: Tool arguments.

        Returns:
            Tool execution result.
        """
        start_time = datetime.now()

        if tool_name not in self._tools_map:
            return ToolExecution(
                name=tool_name,
                arguments=arguments,
                success=False,
                result_preview=f"Tool '{tool_name}' not found",
                duration_ms=0,
                server_name="unknown",
            )

        agg = self._tools_map[tool_name]

        # Check if server is enabled
        if agg.server_name not in self._enabled_servers:
            return ToolExecution(
                name=tool_name,
                arguments=arguments,
                success=False,
                result_preview=f"Server '{agg.server_name}' is disabled",
                duration_ms=0,
                server_name=agg.server_name,
            )

        try:
            result = await agg.server_client.call_tool(tool_name, arguments)
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            # Extract result preview
            preview = self._extract_preview(result)

            return ToolExecution(
                name=tool_name,
                arguments=arguments,
                success=True,
                result_preview=preview,
                result_full=result,
                duration_ms=duration_ms,
                server_name=agg.server_name,
            )

        except Exception as e:
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            logger.error(f"Tool execution failed: {tool_name} - {e}")

            return ToolExecution(
                name=tool_name,
                arguments=arguments,
                success=False,
                result_preview=str(e)[:500],
                duration_ms=duration_ms,
                server_name=agg.server_name,
            )

    def _extract_preview(self, result: CallToolResult, max_len: int = 500) -> str:
        """Extract text preview from MCP result.

        Args:
            result: MCP call result.
            max_len: Maximum preview length.

        Returns:
            Text preview.
        """
        texts = []
        for content in result.content:
            if hasattr(content, "text"):
                texts.append(content.text)
        full_text = "\n".join(texts)
        if len(full_text) > max_len:
            return full_text[:max_len] + "..."
        return full_text

    def get_servers_info(self) -> List[MCPServerInfo]:
        """Get information about all registered servers.

        Returns:
            List of server info.
        """
        servers = []
        for name, client in self._clients.items():
            server_tools = [
                t.tool.name for t in self._tools_map.values()
                if t.server_name == name
            ]
            servers.append(MCPServerInfo(
                name=name,
                transport=client.config.transport,
                connected=client.is_connected,
                enabled=name in self._enabled_servers,
                tools_count=len(server_tools),
                tools=server_tools,
            ))
        return servers

    async def get_health_status(self) -> Dict[str, Dict[str, Any]]:
        """Check health of all MCP server connections.

        Returns:
            Dict of server statuses.
        """
        status = {}
        for name, client in self._clients.items():
            ping_ms = await client.ping() if client.is_connected else -1
            tools_count = len([t for t in self._tools_map.values() if t.server_name == name])

            status[name] = {
                "connected": client.is_connected,
                "enabled": name in self._enabled_servers,
                "tools_count": tools_count,
                "ping_ms": ping_ms,
            }

        return status

    async def shutdown(self) -> None:
        """Gracefully disconnect all servers."""
        for client in self._clients.values():
            await client.disconnect()
        self._clients.clear()
        self._tools_map.clear()
        self._enabled_servers.clear()
        logger.info("MCP Manager shutdown complete")
