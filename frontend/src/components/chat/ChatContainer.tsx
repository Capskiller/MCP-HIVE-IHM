import { useChat } from '@/hooks/useChat';
import { useScrollToBottom } from '@/hooks/useScrollToBottom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedQuestions } from './SuggestedQuestions';

export function ChatContainer() {
  const {
    messages,
    isStreaming,
    sendMessage,
    cancelStream,
  } = useChat();

  const { containerRef, handleScroll } = useScrollToBottom<HTMLDivElement>({
    dependency: messages,
  });

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleSuggestionSelect = (question: string) => {
    sendMessage(question);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isEmpty ? (
          <SuggestedQuestions onSelect={handleSuggestionSelect} />
        ) : (
          <div className="max-w-4xl mx-auto py-4 space-y-4">
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="max-w-4xl mx-auto w-full">
        <ChatInput
          onSend={handleSend}
          onCancel={cancelStream}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
