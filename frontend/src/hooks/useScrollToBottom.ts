import { useEffect, useRef, useCallback } from 'react';

interface UseScrollToBottomOptions {
  behavior?: ScrollBehavior;
  dependency?: unknown;
}

export function useScrollToBottom<T extends HTMLElement>(options: UseScrollToBottomOptions = {}) {
  const { behavior = 'smooth', dependency } = options;
  const containerRef = useRef<T>(null);
  const isAutoScrollEnabled = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current && isAutoScrollEnabled.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  }, [behavior]);

  // Scroll on dependency change
  useEffect(() => {
    scrollToBottom();
  }, [dependency, scrollToBottom]);

  // Handle manual scroll - disable auto-scroll if user scrolls up
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    isAutoScrollEnabled.current = isAtBottom;
  }, []);

  // Re-enable auto-scroll
  const enableAutoScroll = useCallback(() => {
    isAutoScrollEnabled.current = true;
    scrollToBottom();
  }, [scrollToBottom]);

  return {
    containerRef,
    scrollToBottom,
    handleScroll,
    enableAutoScroll,
  };
}
