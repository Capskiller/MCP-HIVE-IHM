import { useConversationStore } from '@/stores/conversationStore';
import { useChatStream } from './useChatStream';

export function useChat() {
  const { sendMessage, cancelStream, isStreaming } = useChatStream();

  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    clearAllConversations,
    getCurrentConversation,
  } = useConversationStore();

  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];

  const startNewConversation = () => {
    const id = createConversation();
    return id;
  };

  const selectConversation = (id: string) => {
    setCurrentConversation(id);
  };

  return {
    // State
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    isStreaming,

    // Actions
    sendMessage,
    cancelStream,
    startNewConversation,
    selectConversation,
    deleteConversation,
    clearAllConversations,
  };
}
