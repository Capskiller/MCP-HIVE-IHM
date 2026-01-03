"""MCP Servers management endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_mcp_manager
from app.api.schemas.mcp import MCPServerInfo, MCPServerToggleRequest
from app.services.mcp.manager import MCPManager

router = APIRouter(prefix="/mcp/servers", tags=["MCP Servers"])


@router.get("", response_model=list[MCPServerInfo])
async def list_servers(
    mcp_manager: MCPManager = Depends(get_mcp_manager),
) -> list[MCPServerInfo]:
    """List all registered MCP servers."""
    return mcp_manager.get_servers_info()


@router.get("/{server_name}")
async def get_server(
    server_name: str,
    mcp_manager: MCPManager = Depends(get_mcp_manager),
) -> MCPServerInfo:
    """Get details of a specific MCP server."""
    servers = mcp_manager.get_servers_info()
    for server in servers:
        if server.name == server_name:
            return server
    raise HTTPException(status_code=404, detail=f"Server '{server_name}' not found")


@router.post("/{server_name}/toggle")
async def toggle_server(
    server_name: str,
    request: MCPServerToggleRequest,
    mcp_manager: MCPManager = Depends(get_mcp_manager),
) -> dict:
    """Enable or disable an MCP server."""
    success = mcp_manager.toggle_server(server_name, request.enabled)
    if not success:
        raise HTTPException(status_code=404, detail=f"Server '{server_name}' not found")

    return {
        "server": server_name,
        "enabled": request.enabled,
        "status": "success",
    }


@router.get("/{server_name}/tools")
async def list_server_tools(
    server_name: str,
    mcp_manager: MCPManager = Depends(get_mcp_manager),
) -> dict:
    """List tools available on a specific MCP server."""
    tools = mcp_manager.get_all_tools(enabled_only=False)
    server_tools = [t for t in tools if t.server_name == server_name]

    if not server_tools:
        raise HTTPException(
            status_code=404,
            detail=f"Server '{server_name}' not found or has no tools",
        )

    return {
        "server": server_name,
        "tools": [t.model_dump() for t in server_tools],
    }
