/**
 * MCP Server and Timeline types for transparent demo interface.
 */

// ===========================================
// MCP Server Types
// ===========================================

export type McpServerStatus = 'connected' | 'disconnected' | 'error' | 'loading';

export interface McpServer {
  name: string;
  transport: string;
  connected: boolean;
  enabled: boolean;
  toolsCount: number;
  tools: string[];
  lastPingMs?: number;
}

export interface McpServerConfig {
  name: string;
  enabled: boolean;
}

// ===========================================
// Timeline Types
// ===========================================

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error';

export interface TimelineToolCall {
  id: string;
  messageId: string;
  conversationId: string;
  toolName: string;
  serverName: string;
  arguments: Record<string, unknown>;
  status: ToolCallStatus;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  resultPreview?: string;
  success?: boolean;
}

export interface TimelineEvent {
  id: string;
  type: 'tool_call_start' | 'tool_call_end' | 'content_start' | 'content_end';
  timestamp: Date;
  data: TimelineToolCall | { messageId: string };
}

// ===========================================
// Model Types
// ===========================================

export type ModelStatus = 'available' | 'loading' | 'pulling' | 'error';

export interface Model {
  name: string;
  size: number;
  modifiedAt: string | null;
  digest: string;
}

export interface ModelPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

// ===========================================
// Health Types
// ===========================================

export type ComponentHealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface ComponentStatus {
  status: ComponentHealthStatus;
  details: Record<string, unknown>;
}

export interface HealthResponse {
  status: ComponentHealthStatus;
  components: Record<string, ComponentStatus>;
  version: string;
}
