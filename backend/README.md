# MCP-HIVE-SmartHub

AI-powered orchestrator for Hive databases via MCP (Model Context Protocol by Anthropic).

## Overview

MCP-HIVE-SmartHub is a FastAPI backend that orchestrates:
- **Multiple MCP servers** (Hive, Cotations, INSEE) via stdio transport
- **Ollama LLM** for natural language understanding and tool calling
- **SSE streaming** for real-time responses with token tracking

## Current Configuration (DGX Spark)

| Service | URL | Description |
|---------|-----|-------------|
| Ollama | http://192.168.1.146:11434 | DGX Spark GPU (128GB RAM) |
| Hive | jdbc:hive2://192.168.1.146:10000 | Base regen_db |
| SmartHub API | http://localhost:8000 | FastAPI Backend |

### Modeles Installes

| Modele | Taille | VRAM | Recommandation |
|--------|--------|------|----------------|
| devstral-2:latest | 75GB | 88GB | Requetes complexes |
| devstral:latest | 14GB | 24GB | Tests rapides |
| devstral-small-2:latest | 15GB | 22GB | **Production** |
| gpt-oss:120b | 65GB | - | Haute qualite |
| llama3.1:70b | 42GB | - | Alternative |
| llama3.1:8b | 5GB | - | Dev/test |

### Base de Donnees Hive

| Table | Lignes | Description |
|-------|--------|-------------|
| operations | 9,954 | Projets renovation urbaine |
| engagements | 16,274 | Engagements financiers |
| qpv_insee | 1,609 | Quartiers prioritaires |
| dictionnaire | 50 | Dictionnaire donnees |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React) :5173                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Chat + BottomDrawer (Timeline | Tokens | Servers)                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │ SSE + REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   MCP-HIVE-SmartHub (FastAPI) :8000                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ ChatOrchestrator│  │   MCPManager    │  │   OllamaClient              │  │
│  │ (tool loop)     │  │ (multi-server)  │  │   (streaming + tokens)      │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────────────────┘  │
│           │                    │                                             │
│           │         ┌──────────┴──────────┐                                  │
│           │         │  stdio transport    │                                  │
│           ▼         ▼                     ▼                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │ MCP Hive    │  │MCP Cotations│  │ MCP INSEE   │                          │
│  │ (5 tools)   │  │ (2 tools)   │  │ (3 tools)   │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DGX Spark Ollama :11434                                  │
│           (devstral-small-2, devstral-2, gpt-oss:120b)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Apache Hive :10000                                        │
│                    (regen_db - 4 tables)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start Docker Services

```bash
cd MCP-HIVE-SmartHub

# Start Ollama + SmartHub API (MCP servers included)
docker compose up -d ollama smarthub-api

# Check status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 2. Pull an LLM Model

```bash
# Pull a small model for testing
curl -X POST http://localhost:8000/models/llama3.2:1b/pull

# Or a better model for production
curl -X POST http://localhost:8000/models/devstral:latest/pull
```

### 3. Verify Health

```bash
# Check API health
curl http://localhost:8000/health

# Check MCP servers
curl http://localhost:8000/mcp/servers

# Check installed models
curl http://localhost:8000/models/installed
```

### 4. Test Chat

```bash
# Simple chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Liste les bases de données Hive", "model": "llama3.2:1b"}'

# Streaming chat with tool calling
curl -N http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Quelles tables sont disponibles?", "model": "llama3.2:1b"}'
```

## Project Structure

```
MCP-HIVE-SmartHub/
├── app/
│   ├── __init__.py              # Version
│   ├── main.py                  # FastAPI entry point + lifespan
│   ├── config.py                # Pydantic Settings
│   ├── api/
│   │   ├── router.py            # API router aggregation
│   │   ├── deps.py              # Dependency injection
│   │   ├── routes/
│   │   │   ├── chat.py          # POST /chat, /chat/stream
│   │   │   ├── health.py        # GET /health/*
│   │   │   ├── models.py        # GET/POST /models/*
│   │   │   └── mcp_servers.py   # GET /mcp/servers
│   │   └── schemas/
│   │       ├── chat.py          # Request/Response + SSE events
│   │       └── mcp.py           # MCP types
│   ├── services/
│   │   ├── mcp/
│   │   │   ├── manager.py       # MCPManager (multi-server orchestration)
│   │   │   └── client.py        # MCPClient (single server wrapper)
│   │   ├── llm/
│   │   │   ├── ollama_client.py # Async Ollama with streaming + tokens
│   │   │   └── tool_converter.py# MCP tools → Ollama format
│   │   └── chat/
│   │       ├── orchestrator.py  # ChatOrchestrator (tool loop + SSE)
│   │       └── conversation.py  # ConversationManager
│   └── utils/
├── config/
│   └── mcp_servers.json         # MCP server definitions
├── mcp-servers/                 # MCP server implementations
│   ├── hive/
│   │   ├── Dockerfile
│   │   └── server.py            # Hive MCP server (5 tools)
│   ├── cotations/
│   │   ├── Dockerfile
│   │   └── server.py            # Cotations MCP server (2 tools)
│   └── insee/
│       ├── Dockerfile
│       └── server.py            # INSEE MCP server (3 tools)
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── README.md
```

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Synchronous chat with tool calling |
| `POST` | `/chat/stream` | SSE streaming chat with real-time events |
| `GET` | `/chat/{id}/history` | Get conversation history |
| `DELETE` | `/chat/{id}` | Delete conversation |
| `GET` | `/health` | Aggregated health status |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |
| `GET` | `/models` | List available models |
| `GET` | `/models/installed` | List installed models |
| `POST` | `/models/{name}/pull` | Download/install model |
| `GET` | `/mcp/servers` | List MCP servers status |
| `POST` | `/mcp/servers/{id}/toggle` | Enable/disable server |

### SSE Stream Events

The `/chat/stream` endpoint emits Server-Sent Events:

```typescript
// Content token
{ "type": "content", "content": "Hello" }

// Tool call started
{
  "type": "tool_call",
  "tool_call": {
    "id": "uuid",
    "name": "list_databases",
    "arguments": {},
    "mcp_server": "hive"
  }
}

// Tool result
{
  "type": "tool_result",
  "tool_result": {
    "id": "uuid",
    "name": "list_databases",
    "success": true,
    "preview": "[\"default\", \"regen_db\"]",
    "duration_ms": 45,
    "mcp_server": "hive"
  }
}

// Stream complete with token counts
{
  "type": "done",
  "metadata": {
    "conversation_id": "uuid",
    "model": "llama3.2:1b",
    "total_duration_ms": 3500,
    "tokens": {
      "prompt": 156,
      "completion": 42,
      "total": 198
    }
  }
}

// Error
{
  "type": "error",
  "error": {
    "code": "STREAM_ERROR",
    "message": "Connection failed"
  }
}
```

## MCP Servers

### Available Tools

| Server | Tool | Description |
|--------|------|-------------|
| **hive** | `execute_query` | Execute HiveQL SELECT (max 1000 rows) |
| **hive** | `list_databases` | List all Hive databases |
| **hive** | `list_tables` | List tables in a database |
| **hive** | `get_table_schema` | Get column definitions |
| **hive** | `get_sample_data` | Get sample rows (max 20) |
| **cotations** | `get_cotation_pdf` | Get ESG rating for engagement ID |
| **cotations** | `search_cotations` | Search cotations by criteria |
| **insee** | `get_qpv_info` | Get QPV details by code |
| **insee** | `search_qpv_by_region` | Search QPV by region |
| **insee** | `get_qpv_statistics` | Get aggregated QPV stats |

### Configuration

Edit `config/mcp_servers.json`:

```json
{
  "servers": [
    {
      "name": "hive",
      "transport": "stdio",
      "command": "python",
      "args": ["/app/mcp-servers/hive/server.py"],
      "enabled": true
    },
    {
      "name": "cotations",
      "transport": "stdio",
      "command": "python",
      "args": ["/app/mcp-servers/cotations/server.py"],
      "enabled": true
    },
    {
      "name": "insee",
      "transport": "stdio",
      "command": "python",
      "args": ["/app/mcp-servers/insee/server.py"],
      "enabled": true
    }
  ]
}
```

## Environment Variables

```bash
# .env (create from .env.example)
DEBUG=true
OLLAMA_BASE_URL=http://ollama:11434
MCP_CONFIG_FILE=/app/config/mcp_servers.json
DEFAULT_MODEL=llama3.2:1b
CORS_ORIGINS=["http://localhost:5173"]
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# Start only backend (no separate MCP containers needed)
docker compose up -d ollama smarthub-api

# View logs
docker compose logs -f smarthub-api

# Rebuild after code changes
docker compose build smarthub-api
docker compose up -d smarthub-api

# Stop all
docker compose down

# Full cleanup (including volumes)
docker compose down -v
```

## Development

### Local Development (without Docker)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Key Classes

**ChatOrchestrator** (`app/services/chat/orchestrator.py`)
- Main chat logic with tool execution loop
- Handles both sync and streaming responses
- Tracks token usage across LLM calls

**MCPManager** (`app/services/mcp/manager.py`)
- Manages multiple MCP server connections
- Aggregates tools from all servers
- Routes tool calls to appropriate server

**OllamaClient** (`app/services/llm/ollama_client.py`)
- Async Ollama client with streaming support
- Extracts token counts from streaming chunks
- Handles tool call responses

## Troubleshooting

### Ollama health check fails
```bash
# Check Ollama logs
docker logs mcp-hive-ollama

# Verify Ollama is responding
docker exec mcp-hive-ollama ollama list
```

### MCP servers not connecting
```bash
# Check SmartHub logs for MCP initialization
docker logs mcp-hive-smarthub | grep -i mcp

# Verify config file
docker exec mcp-hive-smarthub cat /app/config/mcp_servers.json
```

### Port already in use
```bash
# Find process using port
lsof -i :8000

# Or change port in docker-compose.yml
```

## Version History

- **v0.3.0** (2025-12-29)
  - Connexion Hive reelle (192.168.1.146:10000)
  - Support DGX Spark Ollama (192.168.1.146:11434)
  - Ajout System Prompt pour decouverte schema
  - Installation modeles devstral, devstral-2, gpt-oss:120b
  - Documentation echangeia.md des tests

- **v0.2.0** - MCP multi-server avec Cotations et INSEE
- **v0.1.0** - Initial release avec MCP tool calling et SSE streaming
