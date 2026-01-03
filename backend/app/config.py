"""Centralized configuration management using Pydantic Settings."""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class MCPServerConfig(BaseSettings):
    """Configuration for a single MCP server."""

    name: str
    transport: str = "stdio"  # "stdio" | "http"
    command: Optional[str] = None  # For stdio transport
    args: List[str] = Field(default_factory=list)
    url: Optional[str] = None  # For HTTP transport
    enabled: bool = True

    class Config:
        extra = "allow"


class OllamaSettings(BaseSettings):
    """Ollama LLM configuration."""

    base_url: str = "http://192.168.1.146:11434"  # DGX Spark
    default_model: str = "devstral-small-2:latest"  # Best for tool calling
    request_timeout: int = 120  # seconds (faster with GPU)
    num_ctx: int = 8192  # Context window size
    num_predict: int = 2048  # Max tokens to generate

    class Config:
        env_prefix = "OLLAMA_"


class MCPSettings(BaseSettings):
    """MCP servers configuration."""

    config_file: Optional[str] = "config/mcp_servers.json"
    connection_timeout: int = 30  # seconds

    class Config:
        env_prefix = "MCP_"


class ConversationSettings(BaseSettings):
    """Conversation management configuration."""

    max_history_messages: int = 50
    ttl_hours: int = 24
    max_tool_iterations: int = 10

    class Config:
        env_prefix = "CONVERSATION_"


class Settings(BaseSettings):
    """Main application settings."""

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"])

    # Component settings
    ollama: OllamaSettings = Field(default_factory=OllamaSettings)
    mcp: MCPSettings = Field(default_factory=MCPSettings)
    conversation: ConversationSettings = Field(default_factory=ConversationSettings)

    # SSE Configuration
    sse_retry_ms: int = 3000
    stream_timeout_seconds: int = 300

    class Config:
        env_file = ".env"
        env_prefix = "SMARTHUB_"
        env_nested_delimiter = "__"


# Global settings instance
settings = Settings()
