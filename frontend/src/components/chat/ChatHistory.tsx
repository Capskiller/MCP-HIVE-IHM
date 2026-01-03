import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatHistoryProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4">
        <Button onClick={onNewConversation} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      <Separator />

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune conversation
            </p>
          ) : (
            conversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onSelect={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ConversationItem({ conversation, isActive, onSelect, onDelete }: ConversationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(conversation.updatedAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-accent' : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{conversation.title}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}
