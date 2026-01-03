/**
 * Token display component for showing token usage under messages.
 */

import { cn } from '@/lib/utils';
import type { TokenUsage } from '@/types/chat';
import { ArrowUp, ArrowDown, Sigma } from 'lucide-react';

interface TokenDisplayProps {
  tokens: TokenUsage;
  className?: string;
}

export function TokenDisplay({ tokens, className }: TokenDisplayProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-xs text-muted-foreground tabular-nums',
        className
      )}
    >
      {/* Prompt tokens */}
      <span className="flex items-center gap-0.5" title="Prompt tokens">
        <ArrowUp className="h-3 w-3" />
        {tokens.prompt.toLocaleString()}
      </span>

      {/* Completion tokens */}
      <span className="flex items-center gap-0.5" title="Completion tokens">
        <ArrowDown className="h-3 w-3" />
        {tokens.completion.toLocaleString()}
      </span>

      {/* Total tokens */}
      <span className="flex items-center gap-0.5" title="Total tokens">
        <Sigma className="h-3 w-3" />
        {tokens.total.toLocaleString()}
      </span>
    </div>
  );
}
