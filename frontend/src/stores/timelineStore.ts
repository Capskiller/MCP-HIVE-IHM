/**
 * Timeline store for tracking MCP tool executions in real-time.
 */

import { create } from 'zustand';
import type { TimelineToolCall, ToolCallStatus } from '@/types/mcp';

interface TimelineState {
  /** All tool calls across conversations */
  toolCalls: TimelineToolCall[];

  /** Currently active (running) tool calls */
  activeToolCalls: TimelineToolCall[];

  // Actions
  addToolCall: (toolCall: Omit<TimelineToolCall, 'status' | 'startTime'>) => void;
  updateToolCallStatus: (
    toolId: string,
    status: ToolCallStatus,
    result?: { durationMs: number; resultPreview: string; success: boolean }
  ) => void;
  clearTimeline: () => void;
  clearConversationTimeline: (conversationId: string) => void;
  getToolCallsByMessage: (messageId: string) => TimelineToolCall[];
  getToolCallsByConversation: (conversationId: string) => TimelineToolCall[];
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  toolCalls: [],
  activeToolCalls: [],

  addToolCall: (toolCall) => {
    const newToolCall: TimelineToolCall = {
      ...toolCall,
      status: 'running',
      startTime: new Date(),
    };

    set((state) => ({
      toolCalls: [...state.toolCalls, newToolCall],
      activeToolCalls: [...state.activeToolCalls, newToolCall],
    }));
  },

  updateToolCallStatus: (toolId, status, result) => {
    set((state) => {
      const updatedToolCalls = state.toolCalls.map((tc) => {
        if (tc.id === toolId) {
          return {
            ...tc,
            status,
            endTime: status !== 'running' ? new Date() : undefined,
            durationMs: result?.durationMs,
            resultPreview: result?.resultPreview,
            success: result?.success,
          };
        }
        return tc;
      });

      // Remove from active if completed
      const activeToolCalls =
        status === 'running'
          ? state.activeToolCalls
          : state.activeToolCalls.filter((tc) => tc.id !== toolId);

      return { toolCalls: updatedToolCalls, activeToolCalls };
    });
  },

  clearTimeline: () => {
    set({ toolCalls: [], activeToolCalls: [] });
  },

  clearConversationTimeline: (conversationId) => {
    set((state) => ({
      toolCalls: state.toolCalls.filter((tc) => tc.conversationId !== conversationId),
      activeToolCalls: state.activeToolCalls.filter(
        (tc) => tc.conversationId !== conversationId
      ),
    }));
  },

  getToolCallsByMessage: (messageId) => {
    return get().toolCalls.filter((tc) => tc.messageId === messageId);
  },

  getToolCallsByConversation: (conversationId) => {
    return get().toolCalls.filter((tc) => tc.conversationId === conversationId);
  },
}));
