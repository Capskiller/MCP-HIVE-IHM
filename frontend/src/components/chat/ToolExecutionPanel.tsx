import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ToolCall } from '@/types/chat';

interface ToolExecutionPanelProps {
  toolCalls: ToolCall[];
}

export function ToolExecutionPanel({ toolCalls }: ToolExecutionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (toolCalls.length === 0) return null;

  const completedCount = toolCalls.filter(tc => tc.status === 'success').length;
  const hasErrors = toolCalls.some(tc => tc.status === 'error');
  const isRunning = toolCalls.some(tc => tc.status === 'running' || tc.status === 'pending');

  return (
    <div className="mt-2 border rounded-lg bg-muted/30">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 text-sm hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Outils MCP utilisés</span>
          <Badge variant={hasErrors ? 'destructive' : isRunning ? 'secondary' : 'success'}>
            {isRunning ? 'En cours...' : `${completedCount}/${toolCalls.length}`}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t divide-y">
          {toolCalls.map(toolCall => (
            <ToolCallItem key={toolCall.id} toolCall={toolCall} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  const [showDetails, setShowDetails] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />,
    running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-destructive" />,
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon[toolCall.status]}
          <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
            {toolCall.name}
          </code>
          {toolCall.durationMs && (
            <span className="text-xs text-muted-foreground">
              {toolCall.durationMs.toFixed(0)}ms
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showDetails ? 'Masquer' : 'Détails'}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-2 text-xs">
          {/* Arguments */}
          <div>
            <span className="text-muted-foreground">Arguments:</span>
            <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>

          {/* Result preview */}
          {toolCall.result?.preview && (
            <div>
              <span className="text-muted-foreground">Résultat:</span>
              <pre className={cn(
                'mt-1 p-2 rounded overflow-x-auto max-h-32',
                toolCall.result.success ? 'bg-green-500/10' : 'bg-destructive/10'
              )}>
                {toolCall.result.preview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
