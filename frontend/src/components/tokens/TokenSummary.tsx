/**
 * Token summary panel for the drawer.
 */

import { useConversationStore } from '@/stores/conversationStore';
import { TokenDisplay } from './TokenDisplay';
import { Coins } from 'lucide-react';
import type { TokenUsage, Message } from '@/types/chat';

export function TokenSummary() {
  const currentConversationId = useConversationStore((s) => s.currentConversationId);
  const conversations = useConversationStore((s) => s.conversations);
  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  if (!currentConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Coins className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No conversation selected</p>
      </div>
    );
  }

  // Calculate totals
  const totals: TokenUsage = { prompt: 0, completion: 0, total: 0 };
  const messagesWithTokens: Message[] = currentConversation.messages.filter(
    (m: Message) => m.role === 'assistant' && m.tokens
  );

  messagesWithTokens.forEach((m: Message) => {
    if (m.tokens) {
      totals.prompt += m.tokens.prompt;
      totals.completion += m.tokens.completion;
      totals.total += m.tokens.total;
    }
  });

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-lg border p-3">
        <h3 className="text-sm font-medium mb-2">Conversation Total</h3>
        <TokenDisplay tokens={totals} className="text-sm" />
      </div>

      {/* Per-message breakdown */}
      {messagesWithTokens.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Per Message</h3>
          <div className="space-y-1">
            {messagesWithTokens.map((message: Message, index: number) => (
              <div
                key={message.id}
                className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted"
              >
                <span className="text-muted-foreground">
                  Response {index + 1}
                </span>
                {message.tokens && <TokenDisplay tokens={message.tokens} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {messagesWithTokens.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No token data available yet
        </p>
      )}
    </div>
  );
}
