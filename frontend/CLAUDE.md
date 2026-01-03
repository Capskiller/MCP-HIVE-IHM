# MCP-HIVE-IHM - Frontend Application

## Project Summary

Frontend application for **MCP-HIVE-SmartHub** - a transparent demo interface showing how LLMs interact with MCP (Model Context Protocol) servers in real-time.

**Key Features:**
- Real-time SSE streaming with token tracking
- MCP tool execution timeline visualization
- Multi-model selection (Ollama)
- Multi-server status display
- Resizable bottom drawer for technical details

**Backend**: MCP-HIVE-SmartHub v0.3.0 (FastAPI on port 8000)

---

## Backend Configuration (DGX Spark)

| Service | URL | Description |
|---------|-----|-------------|
| API Backend | http://localhost:8000 | MCP-HIVE-SmartHub |
| Ollama | http://192.168.1.146:11434 | DGX Spark 128GB |
| Hive | 192.168.1.146:10000 | Base regen_db |

### Modeles Disponibles

| Modele | Usage | Temps reponse |
|--------|-------|---------------|
| devstral-small-2 | **Production** | ~35s |
| devstral-2 | Requetes complexes | ~50s |
| devstral | Tests rapides | ~35s |

### Base de Donnees

- **operations**: 9,954 projets renovation urbaine
- **engagements**: 16,274 engagements financiers
- **qpv_insee**: 1,609 quartiers prioritaires

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React + TypeScript) :5173                  │
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
│  │         │  ├─────────────────────────────────────────────────────────┤  ││
│  │         │  │ ChatInput                                               │  ││
│  │         │  └─────────────────────────────────────────────────────────┘  ││
│  ├─────────┴───────────────────────────────────────────────────────────────┤│
│  │ ═══════════════════════ DrawerHandle (drag to resize) ═══════════════   ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ [Timeline] [Tokens] [Servers]                    BottomDrawer           ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ ● list_databases (hive)      ████████████  45ms                         ││
│  │ ● execute_query (hive)       ████████████████████  1.2s                 ││
│  │ ○ get_qpv_info (insee)       [running...] 0.3s                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Start Backend

```bash
cd ../MCP-HIVE-SmartHub
docker compose up -d ollama smarthub-api

# Verify backend is running
curl http://localhost:8000/health
curl http://localhost:8000/mcp/servers
```

### 2. Start Frontend

```bash
cd MCP-HIVE-IHM

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Access Application

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## Project Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx      # Main chat area
│   │   ├── ChatHistory.tsx        # Message list with scroll
│   │   ├── ChatInput.tsx          # Input field + send button
│   │   ├── ChatMessage.tsx        # Single message + TokenDisplay
│   │   ├── ToolExecutionPanel.tsx # Tool calls in message
│   │   └── SuggestedQuestions.tsx # Quick prompts
│   ├── drawer/
│   │   ├── BottomDrawer.tsx       # Resizable drawer container
│   │   ├── DrawerHandle.tsx       # Drag handle for resize
│   │   └── DrawerTabs.tsx         # Tab navigation
│   ├── timeline/
│   │   ├── McpTimeline.tsx        # Tool execution timeline
│   │   ├── TimelineEvent.tsx      # Single tool call visualization
│   │   └── ElapsedTimer.tsx       # Real-time running timer
│   ├── tokens/
│   │   ├── TokenDisplay.tsx       # ↑prompt ↓completion Σtotal
│   │   └── TokenSummary.tsx       # Conversation token summary
│   ├── server/
│   │   ├── ServerStatus.tsx       # MCP servers panel
│   │   └── ServerCard.tsx         # Single server card
│   ├── model/
│   │   └── ModelSelector.tsx      # Model dropdown in header
│   ├── layout/
│   │   ├── MainLayout.tsx         # App layout + BottomDrawer
│   │   ├── Header.tsx             # Top bar + ModelSelector
│   │   └── Sidebar.tsx            # Conversation list
│   └── ui/                        # shadcn/ui components
│       ├── button.tsx
│       ├── badge.tsx
│       ├── dropdown-menu.tsx
│       ├── switch.tsx
│       └── ...
├── hooks/
│   ├── useChatStream.ts           # SSE streaming + timeline events
│   ├── useModels.ts               # TanStack Query for models
│   ├── useMcpServers.ts           # TanStack Query for MCP servers
│   ├── useHealth.ts               # TanStack Query for health
│   ├── useResizable.ts            # Drawer resize logic
│   └── useElapsedTimer.ts         # Real-time timer hook
├── stores/
│   ├── conversationStore.ts       # Zustand - conversations + messages
│   ├── timelineStore.ts           # Zustand - tool call timeline
│   ├── modelStore.ts              # Zustand - selected model (persisted)
│   ├── mcpStore.ts                # Zustand - MCP server state
│   └── settingsStore.ts           # Zustand - drawer settings
├── services/
│   ├── api/
│   │   ├── modelsApi.ts           # /models endpoints
│   │   ├── mcpApi.ts              # /mcp/servers endpoints
│   │   └── healthApi.ts           # /health endpoints
│   └── sse/
│       └── streamClient.ts        # SSE connection handler
├── types/
│   ├── chat.ts                    # Message, ToolCall, TokenUsage, SSE events
│   ├── mcp.ts                     # McpServer, TimelineToolCall, Model
│   └── features.ts                # FeatureFlags, DrawerTab
├── lib/
│   ├── constants.ts               # API_ENDPOINTS, APP_CONFIG
│   └── utils.ts                   # cn() helper
├── App.tsx
├── main.tsx
└── index.css                      # Tailwind + animations
```

---

## Key Components

### BottomDrawer (`components/drawer/BottomDrawer.tsx`)
Resizable drawer with 3 tabs:
- **Timeline**: Real-time MCP tool execution visualization
- **Tokens**: Token usage summary per message
- **Servers**: MCP server status with toggle switches

### McpTimeline (`components/timeline/McpTimeline.tsx`)
Shows tool calls with:
- Status indicator (pending/running/success/error)
- Progress bar proportional to duration
- Running timer for active calls
- Expandable details (arguments, results)

### TokenDisplay (`components/tokens/TokenDisplay.tsx`)
Displays token usage: `↑prompt ↓completion Σtotal`

### ModelSelector (`components/model/ModelSelector.tsx`)
Dropdown in header for switching Ollama models.

---

## State Management

### Zustand Stores

**conversationStore** - Conversations and messages
```typescript
{
  conversations: Conversation[],
  currentConversationId: string | null,
  // Actions
  createConversation, addMessage, updateMessage,
  appendMessageContent, addToolCall, updateToolCall
}
```

**timelineStore** - Tool execution tracking
```typescript
{
  toolCalls: TimelineToolCall[],
  activeToolCalls: TimelineToolCall[],
  // Actions
  addToolCall, updateToolCallStatus, clearTimeline
}
```

**modelStore** - Selected model (persisted)
```typescript
{
  selectedModel: string | null,
  modelStatus: Record<string, ModelStatus>,
  setSelectedModel
}
```

**settingsStore** - UI settings
```typescript
{
  drawerHeight: number,
  drawerMinimized: boolean,
  activeDrawerTab: 'timeline' | 'tokens' | 'servers',
  setDrawerHeight, toggleDrawer, setActiveTab
}
```

---

## SSE Streaming Flow

```
1. User sends message
   └─> useChatStream.sendMessage()

2. POST /chat/stream
   └─> streamClient.createStreamConnection()

3. SSE Events received:
   ├─> content      → appendMessageContent()
   ├─> tool_call    → addToolCall() + addTimelineToolCall()
   ├─> tool_result  → updateToolCall() + updateToolCallStatus()
   ├─> done         → updateMessage(tokens)
   └─> error        → updateMessage(error)

4. Timeline updates in real-time
   └─> McpTimeline re-renders with new tool calls
```

---

## API Integration

### Base Configuration (`lib/constants.ts`)
```typescript
export const APP_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};

export const API_ENDPOINTS = {
  chat: '/chat',
  chatStream: '/chat/stream',
  health: '/health',
  models: '/models',
  modelsInstalled: '/models/installed',
  modelPull: (name: string) => `/models/${name}/pull`,
  mcpServers: '/mcp/servers',
};
```

### SSE Event Types (`types/chat.ts`)
```typescript
interface StreamToolCallEvent {
  type: 'tool_call';
  tool_call: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    mcp_server?: string;
  };
}

interface StreamDoneEvent {
  type: 'done';
  metadata: {
    conversation_id: string;
    model: string;
    total_duration_ms: number;
    tokens: { prompt: number; completion: number; total: number };
  };
}
```

---

## CSS Animations

Custom animations in `index.css`:

```css
/* Timeline progress bar animation */
@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); width: 50%; }
  50% { width: 30%; }
  100% { transform: translateX(300%); width: 50%; }
}

.animate-progress-indeterminate {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}
```

---

## Development Commands

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## Dependencies

### Core
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (server state)
- Zustand (client state)

### UI
- Tailwind CSS 4
- shadcn/ui components
- Radix UI primitives
- Lucide React (icons)

### Key packages
```json
{
  "@radix-ui/react-dropdown-menu": "^2.x",
  "@radix-ui/react-switch": "^1.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^5.x"
}
```

---

## Environment Variables

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
```

---

## Testing Queries

```
# Discovery
"Liste les bases de données disponibles"
"Quelles sont les tables dans regen_db ?"

# Tool calling
"Montre-moi le schéma de la table operations"
"Donne-moi un échantillon de la table engagements"

# Multi-tool
"Analyse les engagements du programme NPNRU"
```

---

## Troubleshooting

### Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS
# Backend should allow http://localhost:5173
```

### Models not loading
```bash
# Check installed models
curl http://localhost:8000/models/installed

# Pull a model
curl -X POST http://localhost:8000/models/llama3.2:1b/pull
```

### Timeline not updating
- Check browser console for SSE errors
- Verify `useChatStream` is wiring `addTimelineToolCall`
- Check `timelineStore` state in React DevTools

---

## File Modifications Summary (v0.2.0)

### New Files Created
- `src/types/mcp.ts` - MCP types
- `src/types/features.ts` - Feature flags
- `src/stores/timelineStore.ts` - Timeline state
- `src/stores/modelStore.ts` - Model selection
- `src/stores/mcpStore.ts` - MCP server state
- `src/stores/settingsStore.ts` - UI settings
- `src/hooks/useModels.ts` - Model hooks
- `src/hooks/useMcpServers.ts` - MCP hooks
- `src/hooks/useResizable.ts` - Drawer resize
- `src/hooks/useElapsedTimer.ts` - Timer hook
- `src/components/drawer/*` - Bottom drawer
- `src/components/timeline/*` - Timeline visualization
- `src/components/tokens/*` - Token display
- `src/components/server/*` - Server status
- `src/components/model/*` - Model selector
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/switch.tsx`

### Modified Files
- `src/types/chat.ts` - Added `mcpServer`, `tokens`, SSE types
- `src/hooks/useChatStream.ts` - Wired timeline store, token capture
- `src/services/sse/streamClient.ts` - Added `mcp_server` to callbacks
- `src/components/chat/ChatMessage.tsx` - Added TokenDisplay
- `src/components/layout/MainLayout.tsx` - Added BottomDrawer
- `src/components/layout/Header.tsx` - Added ModelSelector
- `src/index.css` - Added timeline animations
