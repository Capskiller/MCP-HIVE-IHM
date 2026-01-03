# MCP-HIVE-SmartHub - Backend API

## Project Summary

Backend FastAPI orchestrating LLM + MCP servers for querying Apache Hive databases in natural language.

**Frontend**: MCP-HIVE-IHM (React) on port 5173
**Backend**: This project (FastAPI) on port 8000

## Architecture

```
Frontend (React :5173)
        │ SSE + REST
        ▼
SmartHub API (FastAPI :8000)
   ├── ChatOrchestrator (tool loop)
   ├── MCPManager (multi-server)
   └── OllamaClient (streaming)
        │ stdio
        ├── MCP Hive (5 tools)
        ├── MCP Cotations (2 tools)
        └── MCP INSEE (3 tools)
        │
        ▼
DGX Spark Ollama (:11434) ──► Hive (:10000)
```

## Current Configuration

| Service | URL |
|---------|-----|
| Ollama | http://192.168.1.146:11434 |
| Hive | 192.168.1.146:10000 |
| Database | regen_db |

## Key Files

### Configuration
- `app/config.py` - Pydantic settings (Ollama URL, timeouts)
- `config/mcp_servers.json` - MCP server definitions

### Core Services
- `app/services/chat/orchestrator.py` - **Main chat logic + System Prompt**
- `app/services/mcp/manager.py` - Multi-server MCP orchestration
- `app/services/llm/ollama_client.py` - Async Ollama with streaming

### MCP Servers
- `mcp-servers/hive/server.py` - Real Hive connection via PyHive
- `mcp-servers/cotations/server.py` - PDF cotations ESG
- `mcp-servers/insee/server.py` - INSEE QPV data

## System Prompt (Critical)

Location: `app/services/chat/orchestrator.py`

Le System Prompt force le LLM a:
1. Explorer le schema AVANT toute requete SQL
2. Utiliser list_tables, get_table_schema, get_sample_data
3. Construire les requetes uniquement a partir des colonnes decouvertes

**Ne jamais supprimer ce prompt** - sans lui, les modeles devinent les schemas.

## Hive Specifics

### Tables disponibles
- operations (9,954 rows) - Projets renovation urbaine
- engagements (16,274 rows) - Engagements financiers
- qpv_insee (1,609 rows) - Quartiers prioritaires
- dictionnaire (50 rows) - Dictionnaire donnees

### Regles HiveQL
- Pas de point-virgule en fin de requete (auto-supprime dans server.py)
- SELECT only (securite)
- LIMIT automatique a 1000 lignes

## Modeles LLM Recommandes

| Modele | Usage | VRAM |
|--------|-------|------|
| devstral-small-2 | Production | 22GB |
| devstral-2 | Requetes complexes | 88GB |
| devstral | Tests rapides | 24GB |

## Common Commands

```bash
# Start services
docker compose up -d smarthub-api

# Rebuild after changes
docker compose build smarthub-api && docker compose up -d smarthub-api

# View logs
docker compose logs -f smarthub-api

# Test health
curl http://localhost:8000/health

# Test chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Liste les tables", "model": "devstral-small-2:latest"}'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /chat | Chat sync avec tool calling |
| POST | /chat/stream | SSE streaming |
| GET | /health | Status systeme |
| GET | /models/installed | Modeles installes |
| GET | /mcp/servers | Status serveurs MCP |

## SSE Events

```typescript
{ type: 'content', content: string }
{ type: 'tool_call', tool_call: { name, arguments, mcp_server } }
{ type: 'tool_result', tool_result: { name, success, preview, duration_ms } }
{ type: 'done', metadata: { tokens, duration_ms } }
{ type: 'error', error: { code, message } }
```

## Troubleshooting

### Timeout Ollama
Le DGX peut etre lent lors du chargement de gros modeles (devstral-2: 88GB).
Premier appel = chargement VRAM (~2 min), ensuite ~50s.

### Erreur schema
Si le modele invente des colonnes, verifier que le System Prompt est present dans orchestrator.py.

### Semicolon error
Hive rejette les requetes avec `;`. Verifie dans server.py: `query.strip().rstrip(';')`

## Documentation

- `echangeia.md` - Journal des tests et configurations
- `README.md` - Documentation complete du projet
