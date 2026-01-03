import { useState, useCallback, useRef } from 'react';
import { createStreamConnection, type StreamCallbacks } from '@/services/sse/streamClient';
import { useConversationStore } from '@/stores/conversationStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { useModelStore } from '@/stores/modelStore';
import type { Message, ToolCall } from '@/types/chat';

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    currentConversationId,
    createConversation,
    addMessage,
    updateMessage,
    appendMessageContent,
    addToolCall,
    updateToolCall,
  } = useConversationStore();

  const {
    addToolCall: addTimelineToolCall,
    updateToolCallStatus,
  } = useTimelineStore();

  const selectedModel = useModelStore((s) => s.selectedModel);

  const sendMessage = useCallback(
    async (content: string, model?: string) => {
      // Créer une conversation si nécessaire
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = createConversation();
      }

      // Ajouter le message utilisateur
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'completed',
      };
      addMessage(conversationId, userMessage);

      // Préparer le message assistant (streaming)
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
        toolCalls: [],
      };
      addMessage(conversationId, assistantMessage);

      setIsStreaming(true);

      const callbacks: StreamCallbacks = {
        onContent: chunk => {
          appendMessageContent(conversationId!, assistantMessageId, chunk);
        },

        onToolCall: toolCall => {
          const newToolCall: ToolCall = {
            id: toolCall.id,
            name: toolCall.name,
            arguments: toolCall.arguments,
            status: 'running',
            mcpServer: toolCall.mcp_server,
            startTime: new Date(),
          };
          addToolCall(conversationId!, assistantMessageId, newToolCall);

          // Also add to timeline store for visualization
          addTimelineToolCall({
            id: toolCall.id,
            conversationId: conversationId!,
            messageId: assistantMessageId,
            toolName: toolCall.name,
            serverName: toolCall.mcp_server || 'unknown',
            arguments: toolCall.arguments,
          });
        },

        onToolResult: result => {
          updateToolCall(conversationId!, assistantMessageId, result.id, {
            status: result.success ? 'success' : 'error',
            result: {
              success: result.success,
              preview: result.preview,
            },
            durationMs: result.durationMs,
          });

          // Update timeline store
          updateToolCallStatus(result.id, result.success ? 'success' : 'error', {
            durationMs: result.durationMs,
            resultPreview: result.preview,
            success: result.success,
          });
        },

        onDone: metadata => {
          setIsStreaming(false);
          updateMessage(conversationId!, assistantMessageId, {
            status: 'completed',
            tokens: metadata.tokens,
          });
        },

        onError: error => {
          setIsStreaming(false);
          updateMessage(conversationId!, assistantMessageId, {
            status: 'error',
            content:
              error.message || 'Une erreur est survenue. Veuillez réessayer.',
          });
        },
      };

      abortControllerRef.current = createStreamConnection(
        {
          message: content,
          conversation_id: conversationId,
          model: model || selectedModel || undefined,
        },
        callbacks
      );
    },
    [
      currentConversationId,
      createConversation,
      addMessage,
      updateMessage,
      appendMessageContent,
      addToolCall,
      updateToolCall,
      addTimelineToolCall,
      updateToolCallStatus,
      selectedModel,
    ]
  );

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    sendMessage,
    cancelStream,
    isStreaming,
  };
}
