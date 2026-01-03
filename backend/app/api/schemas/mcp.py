"""MCP-related schemas."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ToolInfo(BaseModel):
    """Information about an available tool."""

    name: str
    description: str
    input_schema: Dict[str, Any]
    server_name: str


class ToolExecution(BaseModel):
    """Details of a tool execution."""

    name: str
    arguments: Dict[str, Any]
    result_preview: str
    result_full: Optional[Any] = None
    duration_ms: int
    success: bool
    server_name: str


class MCPServerInfo(BaseModel):
    """Information about an MCP server."""

    name: str
    transport: str
    connected: bool
    enabled: bool
    tools_count: int
    tools: List[str] = []
    last_ping_ms: Optional[int] = None


class MCPServerToggleRequest(BaseModel):
    """Request to toggle MCP server status."""

    enabled: bool
