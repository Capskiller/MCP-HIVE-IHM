import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    startNewConversation,
    deleteConversation,
  } = useChat();

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    onClose(); // Close on mobile
  };

  const handleNewConversation = () => {
    startNewConversation();
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-50 w-72 bg-background border-r transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="font-semibold">Historique</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ChatHistory
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={deleteConversation}
        />
      </aside>
    </>
  );
}
