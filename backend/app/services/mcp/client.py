"""MCP Client wrapper for a single server connection."""

import asyncio
import logging
from typing import Any, Dict, List, Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.types import Tool, CallToolResult

from app.config import MCPServerConfig

logger = logging.getLogger(__name__)


class MCPClient:
    """Wrapper for a single MCP server connection."""

    def __init__(self, config: MCPServerConfig):
        """Initialize MCP client.

        Args:
            config: Server configuration.
        """
        self.config = config
        self._session: Optional[ClientSession] = None
        self._read_stream = None
        self._write_stream = None
        self._context = None
        self.is_connected = False
        self._tools: List[Tool] = []

    @property
    def name(self) -> str:
        """Server name."""
        return self.config.name

    async def connect(self) -> None:
        """Establish connection to MCP server."""
        try:
            if self.config.transport == "stdio":
                if not self.config.command:
                    raise ValueError(f"No command specified for stdio transport: {self.name}")

                params = StdioServerParameters(
                    command=self.config.command,
                    args=self.config.args,
                )
                self._context = stdio_client(params)
                self._read_stream, self._write_stream = await self._context.__aenter__()
            else:
                # HTTP transport - for future implementation
                raise NotImplementedError(f"HTTP transport not yet implemented for {self.name}")

            self._session = ClientSession(self._read_stream, self._write_stream)
            await self._session.__aenter__()
            await self._session.initialize()
            self.is_connected = True

            # Cache tools
            result = await self._session.list_tools()
            self._tools = result.tools

            logger.info(f"Connected to MCP server '{self.name}' with {len(self._tools)} tools")

        except Exception as e:
            logger.error(f"Failed to connect to MCP server '{self.name}': {e}")
            self.is_connected = False
            raise

    async def disconnect(self) -> None:
        """Close connection."""
        try:
            if self._session:
                await self._session.__aexit__(None, None, None)
            if self._context:
                await self._context.__aexit__(None, None, None)
        except Exception as e:
            logger.warning(f"Error disconnecting from '{self.name}': {e}")
        finally:
            self.is_connected = False
            self._session = None
            self._context = None
            logger.info(f"Disconnected from MCP server '{self.name}'")

    async def list_tools(self) -> List[Tool]:
        """Get available tools from this server.

        Returns:
            List of available tools.
        """
        if not self._session:
            raise RuntimeError(f"Not connected to '{self.name}'")
        return self._tools

    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> CallToolResult:
        """Execute a tool on this server.

        Args:
            name: Tool name.
            arguments: Tool arguments.

        Returns:
            Tool execution result.
        """
        if not self._session:
            raise RuntimeError(f"Not connected to '{self.name}'")
        return await self._session.call_tool(name, arguments=arguments)

    async def ping(self) -> int:
        """Ping the server and return latency in ms.

        Returns:
            Latency in milliseconds.
        """
        if not self._session:
            return -1

        start = asyncio.get_event_loop().time()
        try:
            await self._session.list_tools()
            return int((asyncio.get_event_loop().time() - start) * 1000)
        except Exception:
            return -1
