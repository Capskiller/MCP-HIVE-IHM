"""Convert MCP tools to Ollama format."""

from typing import Any, Dict, List

from app.api.schemas.mcp import ToolInfo


def mcp_tools_to_ollama_format(tools: List[ToolInfo]) -> List[Dict[str, Any]]:
    """Convert MCP tool definitions to Ollama tool format.

    Ollama expects:
    {
        "type": "function",
        "function": {
            "name": "...",
            "description": "...",
            "parameters": { JSON Schema }
        }
    }

    Args:
        tools: List of MCP tools.

    Returns:
        List of tools in Ollama format.
    """
    ollama_tools = []
    for tool in tools:
        ollama_tool = {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.input_schema or {
                    "type": "object",
                    "properties": {},
                },
            },
        }
        ollama_tools.append(ollama_tool)
    return ollama_tools
