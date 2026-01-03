import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/types/chat';
import { ToolExecutionPanel } from './ToolExecutionPanel';
import { TokenDisplay } from '@/components/tokens/TokenDisplay';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-lg',
        isUser ? 'bg-muted/50' : 'bg-background',
        isError && 'border border-destructive/50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Role label */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'Vous' : 'Assistant'}
          </span>
          {isStreaming && (
            <span className="text-xs text-muted-foreground animate-pulse">
              En cours...
            </span>
          )}
        </div>

        {/* Message content */}
        <div className={cn('prose prose-sm dark:prose-invert max-w-none', isError && 'text-destructive')}>
          {message.content || (isStreaming && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
            </span>
          ))}
          {isStreaming && message.content && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
          )}
        </div>

        {/* Tool executions */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolExecutionPanel toolCalls={message.toolCalls} />
        )}

        {/* Token usage for assistant messages */}
        {!isUser && message.tokens && message.status === 'completed' && (
          <TokenDisplay tokens={message.tokens} className="mt-2" />
        )}
      </div>
    </div>
  );
}
