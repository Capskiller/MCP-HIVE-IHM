export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'error';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: ToolResult;
  durationMs?: number;
  mcpServer?: string; // MCP server that handled this tool
  startTime?: Date; // For timeline tracking
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  preview?: string;
  error?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  toolCalls?: ToolCall[];
  tokens?: TokenUsage; // Token usage for this message
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  conversation_id: string;
  model: string;
  tools_used: string[];
  tool_executions: ToolExecution[];
  total_duration_ms: number;
  tokens: TokenUsage;
  status: 'processing' | 'completed' | 'error';
}

export interface ToolExecution {
  name: string;
  arguments: Record<string, unknown>;
  result_preview: string;
  duration_ms: number;
  success: boolean;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// SSE Stream Events
export type StreamEventType = 'content' | 'tool_call' | 'tool_result' | 'done' | 'error';

export interface StreamContentEvent {
  type: 'content';
  content: string;
}

export interface StreamToolCallEvent {
  type: 'tool_call';
  tool_call: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    mcp_server?: string; // MCP server handling this tool
  };
}

export interface StreamToolResultEvent {
  type: 'tool_result';
  tool_result: {
    id: string;
    name: string;
    success: boolean;
    preview: string;
    duration_ms: number;
    mcp_server?: string; // MCP server that handled this tool
  };
}

export interface StreamDoneEvent {
  type: 'done';
  metadata: {
    conversation_id: string;
    model: string;
    total_duration_ms: number;
    tokens: TokenUsage;
  };
}

export interface StreamErrorEvent {
  type: 'error';
  error: {
    code: string;
    message: string;
  };
}

export type StreamEvent =
  | StreamContentEvent
  | StreamToolCallEvent
  | StreamToolResultEvent
  | StreamDoneEvent
  | StreamErrorEvent;
