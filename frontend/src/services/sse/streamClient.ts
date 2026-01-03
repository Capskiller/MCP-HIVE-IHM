import { APP_CONFIG, API_ENDPOINTS } from '@/lib/constants';
import type { StreamEvent, ChatRequest } from '@/types/chat';

export interface StreamCallbacks {
  onContent: (content: string) => void;
  onToolCall: (toolCall: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    mcp_server?: string;
  }) => void;
  onToolResult: (result: {
    id: string;
    name: string;
    success: boolean;
    preview: string;
    durationMs: number;
    mcp_server?: string;
  }) => void;
  onDone: (metadata: {
    conversationId: string;
    model: string;
    totalDurationMs: number;
    tokens: { prompt: number; completion: number; total: number };
  }) => void;
  onError: (error: { code: string; message: string }) => void;
}

export function createStreamConnection(
  request: ChatRequest,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  const url = `${APP_CONFIG.apiBaseUrl}${API_ENDPOINTS.chatStream}`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ ...request, stream: true }),
    signal: controller.signal,
  })
    .then(async response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              return;
            }

            try {
              const event = JSON.parse(data) as StreamEvent;
              handleStreamEvent(event, callbacks);
            } catch {
              // Si ce n'est pas du JSON, c'est du contenu texte brut
              if (data) {
                callbacks.onContent(data);
              }
            }
          }
        }
      }
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        callbacks.onError({
          code: 'STREAM_ERROR',
          message: error.message || 'Une erreur est survenue lors du streaming',
        });
      }
    });

  return controller;
}

function handleStreamEvent(event: StreamEvent, callbacks: StreamCallbacks): void {
  switch (event.type) {
    case 'content':
      callbacks.onContent(event.content);
      break;

    case 'tool_call':
      callbacks.onToolCall({
        id: event.tool_call.id,
        name: event.tool_call.name,
        arguments: event.tool_call.arguments,
        mcp_server: event.tool_call.mcp_server,
      });
      break;

    case 'tool_result':
      callbacks.onToolResult({
        id: event.tool_result.id,
        name: event.tool_result.name,
        success: event.tool_result.success,
        preview: event.tool_result.preview,
        durationMs: event.tool_result.duration_ms,
        mcp_server: event.tool_result.mcp_server,
      });
      break;

    case 'done':
      callbacks.onDone({
        conversationId: event.metadata.conversation_id,
        model: event.metadata.model,
        totalDurationMs: event.metadata.total_duration_ms,
        tokens: event.metadata.tokens,
      });
      break;

    case 'error':
      callbacks.onError(event.error);
      break;
  }
}
