/**
 * MCP Timeline - Visualizes tool executions in real-time.
 */

import { useTimelineStore } from '@/stores/timelineStore';
import { useConversationStore } from '@/stores/conversationStore';
import { TimelineEvent } from './TimelineEvent';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';

export function McpTimeline() {
  const currentConversationId = useConversationStore((s) => s.currentConversationId);
  const toolCalls = useTimelineStore((s) => s.toolCalls);
  const activeToolCalls = useTimelineStore((s) => s.activeToolCalls);

  // Filter to current conversation
  const conversationToolCalls = currentConversationId
    ? toolCalls.filter((tc) => tc.conversationId === currentConversationId)
    : [];

  // Calculate max duration for proportional bars
  const maxDuration = Math.max(
    ...conversationToolCalls.map((tc) => tc.durationMs || 1000),
    1000
  );

  if (conversationToolCalls.length === 0 && activeToolCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Activity className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No tool executions yet</p>
        <p className="text-xs mt-1">Tool calls will appear here in real-time</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 pr-4">
        {conversationToolCalls.map((toolCall) => (
          <TimelineEvent
            key={toolCall.id}
            toolCall={toolCall}
            maxDuration={maxDuration}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
