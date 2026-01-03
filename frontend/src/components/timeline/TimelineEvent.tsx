/**
 * Individual timeline event component.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineToolCall } from '@/types/mcp';
import { ElapsedTimer } from './ElapsedTimer';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface TimelineEventProps {
  toolCall: TimelineToolCall;
  maxDuration: number;
}

export function TimelineEvent({ toolCall, maxDuration }: TimelineEventProps) {
  const [expanded, setExpanded] = useState(false);

  const isRunning = toolCall.status === 'running';
  const isSuccess = toolCall.status === 'success';
  const isError = toolCall.status === 'error';
  const isPending = toolCall.status === 'pending';

  const durationPercent = toolCall.durationMs
    ? Math.min(100, (toolCall.durationMs / maxDuration) * 100)
    : 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-2 transition-colors',
        isRunning && 'border-blue-500/50 bg-blue-500/5',
        isSuccess && 'border-green-500/30',
        isError && 'border-red-500/30',
        isPending && 'border-muted'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {/* Status indicator */}
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full shrink-0',
            isPending && 'bg-gray-400',
            isRunning && 'bg-blue-500 animate-pulse',
            isSuccess && 'bg-green-500',
            isError && 'bg-red-500'
          )}
        />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-muted rounded"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Tool name */}
        <code className="text-sm font-mono flex-1 truncate">
          {toolCall.toolName}
        </code>

        {/* Server badge */}
        <Badge variant="outline" className="text-xs shrink-0">
          {toolCall.serverName}
        </Badge>

        {/* Duration or timer */}
        <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
          {isRunning ? (
            <ElapsedTimer startTime={toolCall.startTime} />
          ) : toolCall.durationMs ? (
            `${toolCall.durationMs}ms`
          ) : (
            '-'
          )}
        </span>

        {/* Status icon */}
        <div className="shrink-0">
          {isPending && <Clock className="h-4 w-4 text-gray-400" />}
          {isRunning && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
          {isSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {isError && <XCircle className="h-4 w-4 text-red-500" />}
        </div>
      </div>

      {/* Progress bar */}
      {!isRunning && toolCall.durationMs && (
        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isSuccess && 'bg-green-500',
              isError && 'bg-red-500'
            )}
            style={{ width: `${durationPercent}%` }}
          />
        </div>
      )}

      {/* Running progress (indeterminate) */}
      {isRunning && (
        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-progress-indeterminate" />
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 pt-2 border-t space-y-2">
          {/* Arguments */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Arguments:
            </span>
            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>

          {/* Result preview */}
          {toolCall.resultPreview && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Result:
              </span>
              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                {toolCall.resultPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
