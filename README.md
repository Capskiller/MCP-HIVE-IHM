# MCP-HIVE

**Interface de démonstration transparente pour les interactions LLM + MCP en temps réel**

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

---

## Vue d'ensemble

MCP-HIVE est une application full-stack qui démontre comment les LLMs interagissent avec les serveurs MCP (Model Context Protocol) en temps réel. L'interface affiche de manière transparente :

- Le streaming token par token des réponses LLM
- Les appels d'outils MCP avec timeline visuelle
- Le suivi des tokens (prompt/completion/total)
- L'état de connexion des serveurs MCP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React) :5173                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Header: [Logo] ─────────────────────────── [ModelSelector ▼] [Theme]    ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ Sidebar │                    ChatContainer                              ││
│  │         │  ┌─────────────────────────────────────────────────────────┐  ││
│  │ History │  │ ChatMessage (user)                                      │  ││
│  │         │  ├─────────────────────────────────────────────────────────┤  ││
│  │         │  │ ChatMessage (assistant)                                 │  ││
│  │         │  │   └─ ToolExecutionPanel                                 │  ││
│  │         │  │   └─ TokenDisplay (↑45 ↓123 Σ168)                       │  ││
│  │         │  └─────────────────────────────────────────────────────────┘  ││
│  ├─────────┴───────────────────────────────────────────────────────────────┤│
│  │ ═══════════════════════ BottomDrawer (Timeline | Tokens | Servers) ═══  ││
│  │ ● list_databases (hive)      ████████████  45ms                         ││
│  │ ● execute_query (hive)       ████████████████████  1.2s                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
MCP-HIVE/
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Composants React (chat, timeline, etc.)
│   │   ├── hooks/          # Hooks personnalisés (useChat, useChatStream)
│   │   ├── stores/         # Zustand stores (conversation, timeline)
│   │   ├── services/       # API client + SSE streaming
│   │   └── types/          # Définitions TypeScript
│   └── package.json
│
├── backend/                # FastAPI + Python
│   ├── app/
│   │   ├── api/            # Routes REST + SSE
│   │   ├── services/       # Orchestrateur, MCP Manager, Ollama Client
│   │   └── config.py       # Configuration Pydantic
│   ├── mcp-servers/        # Serveurs MCP (Hive, INSEE, Cotations)
│   ├── config/             # Configuration MCP
│   └── requirements.txt
│
├── docker-compose.yml      # Orchestration Docker
├── Makefile               # Commandes de développement
└── README.md
```

---

## Quick Start

### Prérequis

- **Node.js** 18+ et npm/pnpm
- **Python** 3.12+
- **Docker** et Docker Compose (optionnel)
- **Ollama** accessible (local ou distant)

### Installation

```bash
# Cloner et accéder au projet
cd MCP-HIVE

# Installer toutes les dépendances
make install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs
```

### Démarrage

#### Option 1: Docker (Recommandé)

```bash
# Démarrer tous les services
make docker-up

# Voir les logs
make docker-logs

# Arrêter
make docker-down
```

#### Option 2: Développement local

```bash
# Terminal 1: Backend
make dev-backend

# Terminal 2: Frontend
make dev-frontend
```

### Accès

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **API Backend** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |

---

## Configuration

### Variables d'environnement

```bash
# .env

# Ollama LLM (DGX Spark ou local)
OLLAMA_BASE_URL=http://192.168.1.146:11434
OLLAMA_DEFAULT_MODEL=devstral-small-2:latest

# Base de données Hive
HIVE_HOST=192.168.1.146
HIVE_PORT=10000
HIVE_DATABASE=regen_db

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

### Modèles Ollama disponibles

| Modèle | Taille | Usage | Temps de réponse |
|--------|--------|-------|------------------|
| `devstral-small-2` | 15 GB | **Production** | ~35s |
| `devstral-2` | 75 GB | Requêtes complexes | ~50s |
| `devstral` | 15 GB | Tests rapides | ~35s |

### Serveurs MCP configurés

| Serveur | Outils | Description |
|---------|--------|-------------|
| **hive** | 5 | Requêtes SQL sur base Hive (regen_db) |
| **insee** | 3 | Données QPV (Quartiers Prioritaires) |
| **cotations** | 2 | Notations ESG extra-financières |

---

## Utilisation

### Exemples de requêtes

```
# Découverte
"Liste les bases de données disponibles"
"Quelles sont les tables dans regen_db ?"

# Exploration de schéma
"Montre-moi le schéma de la table operations"
"Donne-moi un échantillon de la table engagements"

# Requêtes analytiques
"Analyse les engagements du programme NPNRU"
"Quels sont les projets avec un budget supérieur à 1M€ ?"

# Multi-outils
"Trouve les QPV de la région Ile-de-France et leur budget total"
```

---

## Stack Technique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18 | Framework UI |
| TypeScript | 5.7 | Typage statique |
| Vite | 6.0 | Build tool |
| Zustand | 5 | State management (client) |
| TanStack Query | 5 | State management (serveur) |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | - | Composants UI |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| FastAPI | 0.115+ | Framework API |
| Python | 3.12 | Runtime |
| MCP SDK | 1.0+ | Protocol MCP |
| Ollama | 0.4+ | Client LLM |
| SSE-Starlette | 2.2+ | Streaming SSE |
| PyHive | 0.7+ | Connexion Hive |

---

## Commandes Make

```bash
make help              # Afficher l'aide
make install           # Installer toutes les dépendances
make dev               # Instructions pour le développement
make dev-frontend      # Démarrer le frontend (Vite :5173)
make dev-backend       # Démarrer le backend (Uvicorn :8000)
make docker-up         # Démarrer avec Docker
make docker-down       # Arrêter Docker
make docker-logs       # Voir les logs Docker
make clean             # Nettoyer les artefacts
make health            # Vérifier l'état du backend
```

---

## API Endpoints

### Chat

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/chat` | Chat non-streaming |
| POST | `/chat/stream` | Chat SSE streaming |
| GET | `/chat/{id}/history` | Historique conversation |
| DELETE | `/chat/{id}` | Supprimer conversation |

### Modèles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/models` | Liste tous les modèles |
| GET | `/models/installed` | Modèles installés |
| GET | `/models/{name}` | Info modèle |
| POST | `/models/{name}/pull` | Télécharger modèle |

### MCP Servers

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/mcp/servers` | Liste serveurs MCP |
| POST | `/mcp/servers/{name}/toggle` | Activer/désactiver |
| GET | `/mcp/servers/{name}/tools` | Outils du serveur |

### Health

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | État agrégé |
| GET | `/health/live` | Probe Kubernetes liveness |
| GET | `/health/ready` | Probe Kubernetes readiness |

---

## Événements SSE (Streaming)

Le streaming utilise Server-Sent Events avec les types suivants :

```typescript
// Contenu texte (token par token)
{ "type": "content", "content": "..." }

// Appel d'outil MCP
{ "type": "tool_call", "tool_call": { "id", "name", "arguments", "mcp_server" } }

// Résultat d'outil
{ "type": "tool_result", "tool_result": { "id", "success", "preview", "duration_ms" } }

// Fin du streaming
{ "type": "done", "metadata": { "conversation_id", "model", "tokens" } }

// Erreur
{ "type": "error", "error": { "code", "message" } }
```

---

## Troubleshooting

### Le frontend ne se connecte pas au backend

```bash
# Vérifier que le backend tourne
curl http://localhost:8000/health

# Vérifier CORS (le backend doit autoriser localhost:5173)
```

### Les modèles ne chargent pas

```bash
# Vérifier Ollama
curl http://192.168.1.146:11434/api/tags

# Télécharger un modèle
curl -X POST http://localhost:8000/models/devstral-small-2/pull
```

### La timeline ne se met pas à jour

- Vérifier la console navigateur pour les erreurs SSE
- Vérifier que `useChatStream` appelle `addTimelineToolCall`
- Inspecter `timelineStore` dans React DevTools

---

## Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## Auteurs

- **Équipe MCP-HIVE** - Développement initial
