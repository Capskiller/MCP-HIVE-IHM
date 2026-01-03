# MCP-HIVE - Monorepo Full-Stack

## Project Summary

Full-stack application demonstrating transparent LLM + MCP (Model Context Protocol) interactions in real-time.

**Structure:**
- `frontend/` - React 18 + TypeScript + Vite (port 5173)
- `backend/` - FastAPI + Python 3.12 (port 8000)

**Version:** 0.3.0

---

## Quick Commands

```bash
# Install all dependencies
make install

# Development (2 terminals)
make dev-backend    # Terminal 1
make dev-frontend   # Terminal 2

# Docker
make docker-up      # Start all services
make docker-down    # Stop services
make docker-logs    # View logs

# Health check
make health
curl http://localhost:8000/health
```

---

## Architecture Overview

```
Frontend (React :5173)
    │
    │ REST + SSE Streaming
    ▼
Backend (FastAPI :8000)
    │
    ├── ChatOrchestrator (tool loop)
    ├── MCPManager (multi-server)
    └── OllamaClient (LLM streaming)
    │
    │ stdio transport
    ▼
MCP Servers
    ├── hive (5 tools) - SQL queries on Hive DB
    ├── insee (3 tools) - QPV priority neighborhoods
    └── cotations (2 tools) - ESG ratings
```

---

## Backend Configuration

| Service | URL | Description |
|---------|-----|-------------|
| API Backend | http://localhost:8000 | FastAPI SmartHub |
| Ollama | http://192.168.1.146:11434 | DGX Spark 128GB |
| Hive | 192.168.1.146:10000 | Database regen_db |

### Available Models

| Model | Usage | Response Time |
|-------|-------|---------------|
| devstral-small-2 | **Production** | ~35s |
| devstral-2 | Complex queries | ~50s |
| devstral | Quick tests | ~35s |

### Database Tables

| Table | Rows | Description |
|-------|------|-------------|
| operations | 9,954 | Urban renovation projects |
| engagements | 16,274 | Financial commitments |
| qpv_insee | 1,609 | Priority neighborhoods |
| dictionnaire | 50 | Data dictionary |

---

## Frontend Structure

```
frontend/src/
├── components/
│   ├── chat/           # ChatContainer, ChatMessage, ChatInput
│   ├── drawer/         # BottomDrawer, DrawerTabs
│   ├── timeline/       # McpTimeline, TimelineEvent
│   ├── tokens/         # TokenDisplay, TokenSummary
│   ├── server/         # ServerStatus, ServerCard
│   ├── model/          # ModelSelector
│   ├── layout/         # MainLayout, Header, Sidebar
│   └── ui/             # shadcn/ui components
├── hooks/
│   ├── useChat.ts              # High-level chat orchestration
│   ├── useChatStream.ts        # SSE streaming + timeline
│   ├── useModels.ts            # TanStack Query for models
│   ├── useMcpServers.ts        # TanStack Query for MCP
│   ├── useResizable.ts         # Drawer resize
│   └── useElapsedTimer.ts      # Real-time timer
├── stores/
│   ├── conversationStore.ts    # Conversations + messages
│   ├── timelineStore.ts        # Tool execution timeline
│   ├── modelStore.ts           # Selected model (persisted)
│   ├── mcpStore.ts             # MCP server state
│   └── settingsStore.ts        # UI settings
├── services/
│   ├── api/                    # REST API clients
│   └── sse/streamClient.ts     # SSE connection handler
└── types/
    ├── chat.ts                 # Message, ToolCall, SSE events
    └── mcp.ts                  # McpServer, TimelineToolCall
```

---

## Backend Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, lifespan
│   ├── config.py               # Pydantic settings
│   ├── api/
│   │   ├── router.py           # Route aggregator
│   │   ├── deps.py             # Dependency injection
│   │   ├── routes/
│   │   │   ├── chat.py         # /chat, /chat/stream
│   │   │   ├── models.py       # /models/*
│   │   │   ├── health.py       # /health/*
│   │   │   └── mcp_servers.py  # /mcp/servers/*
│   │   └── schemas/
│   │       ├── chat.py         # ChatRequest, SSE events
│   │       ├── mcp.py          # MCPServerInfo, ToolExecution
│   │       └── health.py       # HealthResponse
│   └── services/
│       ├── mcp/
│       │   ├── manager.py      # MCPManager (multi-server)
│       │   └── client.py       # MCPClient (single server)
│       ├── llm/
│       │   ├── ollama_client.py # Async Ollama client
│       │   └── tool_converter.py # MCP → Ollama format
│       └── chat/
│           ├── orchestrator.py  # ChatOrchestrator (tool loop)
│           └── conversation.py  # ConversationManager
├── mcp-servers/
│   ├── hive/server.py          # Hive SQL tools
│   ├── insee/server.py         # INSEE QPV tools
│   └── cotations/server.py     # ESG rating tools
├── config/
│   └── mcp_servers.json        # MCP server configurations
└── requirements.txt
```

---

## API Endpoints Summary

### Chat
- `POST /chat` - Non-streaming chat
- `POST /chat/stream` - SSE streaming chat
- `GET /chat/{id}/history` - Get conversation history
- `DELETE /chat/{id}` - Delete conversation

### Models
- `GET /models` - List all models
- `GET /models/installed` - List installed models
- `GET /models/{name}` - Get model info
- `POST /models/{name}/pull` - Pull model (SSE progress)

### MCP Servers
- `GET /mcp/servers` - List all MCP servers
- `POST /mcp/servers/{name}/toggle` - Enable/disable server
- `GET /mcp/servers/{name}/tools` - List server tools

### Health
- `GET /health` - Aggregated health status
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe

---

## SSE Event Types

```typescript
// Content streaming
{ "type": "content", "content": string }

// Tool call started
{ "type": "tool_call", "tool_call": { id, name, arguments, mcp_server } }

// Tool result
{ "type": "tool_result", "tool_result": { id, success, preview, duration_ms } }

// Stream complete
{ "type": "done", "metadata": { conversation_id, model, tokens } }

// Error
{ "type": "error", "error": { code, message } }
```

---

## State Management

### Zustand Stores (Frontend)

| Store | Persisted | Purpose |
|-------|-----------|---------|
| conversationStore | Yes | Conversations, messages, tool calls |
| timelineStore | No | Real-time tool execution timeline |
| modelStore | Partial | Selected model only |
| mcpStore | Partial | Server enable/disable configs |
| settingsStore | Yes | Drawer height, tabs, feature flags |

### Data Flow

```
User Message → useChatStream.sendMessage()
    │
    ├─► conversationStore.addMessage(user)
    ├─► conversationStore.addMessage(assistant, streaming)
    │
    └─► SSE /chat/stream
         │
         ├─► onContent → appendMessageContent()
         ├─► onToolCall → addToolCall() [both stores]
         ├─► onToolResult → updateToolCall() [both stores]
         └─► onDone → updateMessage({tokens})
```

---

## Testing Queries

```
# Discovery
"Liste les bases de données disponibles"
"Quelles sont les tables dans regen_db ?"

# Schema exploration
"Montre-moi le schéma de la table operations"
"Donne-moi un échantillon de la table engagements"

# Analytics
"Analyse les engagements du programme NPNRU"
"Quels projets ont un budget > 1M€ ?"
```

---

## Environment Variables

```bash
# Backend
OLLAMA_BASE_URL=http://192.168.1.146:11434
OLLAMA_DEFAULT_MODEL=devstral-small-2:latest
HIVE_HOST=192.168.1.146
HIVE_PORT=10000
HIVE_DATABASE=regen_db

# Frontend
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=MCP-HIVE
```

---

## Key Files Reference

### Frontend
- `frontend/src/hooks/useChatStream.ts` - SSE streaming orchestration
- `frontend/src/services/sse/streamClient.ts` - SSE connection handler
- `frontend/src/stores/conversationStore.ts` - Message state
- `frontend/src/stores/timelineStore.ts` - Timeline state
- `frontend/src/components/timeline/McpTimeline.tsx` - Timeline UI

### Backend
- `backend/app/api/routes/chat.py` - Chat endpoints
- `backend/app/services/chat/orchestrator.py` - Tool execution loop
- `backend/app/services/mcp/manager.py` - Multi-server MCP manager
- `backend/app/services/llm/ollama_client.py` - LLM client
- `backend/config/mcp_servers.json` - MCP configuration

---

## Troubleshooting

### Backend not responding
```bash
curl http://localhost:8000/health
docker compose logs smarthub-api
```

### Models not loading
```bash
curl http://192.168.1.146:11434/api/tags
curl -X POST http://localhost:8000/models/devstral-small-2/pull
```

### Timeline not updating
- Check browser console for SSE errors
- Verify `timelineStore` in React DevTools
- Check `useChatStream` is calling `addTimelineToolCall`
