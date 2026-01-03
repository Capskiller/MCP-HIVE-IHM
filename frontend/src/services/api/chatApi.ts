import { API_ENDPOINTS } from '@/lib/constants';
import type { ChatRequest, ChatResponse } from '@/types/chat';
import { apiClient } from './client';

export interface ConversationHistory {
  conversation_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export const chatApi = {
  /**
   * Send a chat message (non-streaming)
   */
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse>(API_ENDPOINTS.chat, request);
  },

  /**
   * Get conversation history
   */
  getHistory: async (conversationId: string): Promise<ConversationHistory> => {
    return apiClient.get<ConversationHistory>(API_ENDPOINTS.chatHistory(conversationId));
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId: string): Promise<{ status: string }> => {
    return apiClient.delete<{ status: string }>(API_ENDPOINTS.chatDelete(conversationId));
  },
};
