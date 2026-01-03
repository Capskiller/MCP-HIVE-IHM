import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, Message, ToolCall } from '@/types/chat';

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;

  // Actions
  createConversation: () => string;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  appendMessageContent: (conversationId: string, messageId: string, content: string) => void;
  addToolCall: (conversationId: string, messageId: string, toolCall: ToolCall) => void;
  updateToolCall: (
    conversationId: string,
    messageId: string,
    toolCallId: string,
    updates: Partial<ToolCall>
  ) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  getCurrentConversation: () => Conversation | undefined;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,

      createConversation: () => {
        const id = crypto.randomUUID();
        const newConversation: Conversation = {
          id,
          title: 'Nouvelle conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));
        return id;
      },

      setCurrentConversation: (id: string | null) => {
        set({ currentConversationId: id });
      },

      addMessage: (conversationId: string, message: Message) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date(),
                  // Auto-title from first user message
                  title:
                    conv.messages.length === 0 && message.role === 'user'
                      ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                      : conv.title,
                }
              : conv
          ),
        }));
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      appendMessageContent: (conversationId: string, messageId: string, content: string) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === messageId ? { ...msg, content: msg.content + content } : msg
                  ),
                }
              : conv
          ),
        }));
      },

      addToolCall: (conversationId: string, messageId: string, toolCall: ToolCall) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, toolCalls: [...(msg.toolCalls || []), toolCall] }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      updateToolCall: (
        conversationId: string,
        messageId: string,
        toolCallId: string,
        updates: Partial<ToolCall>
      ) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          toolCalls: msg.toolCalls?.map(tc =>
                            tc.id === toolCallId ? { ...tc, ...updates } : tc
                          ),
                        }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      deleteConversation: (id: string) => {
        set(state => ({
          conversations: state.conversations.filter(conv => conv.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      clearAllConversations: () => {
        set({ conversations: [], currentConversationId: null });
      },

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find(c => c.id === state.currentConversationId);
      },
    }),
    {
      name: 'mcp-hive-conversations',
      partialize: state => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
