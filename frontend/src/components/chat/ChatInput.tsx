import { useState, useRef, useCallback } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onCancel,
  isStreaming = false,
  disabled = false,
  placeholder = 'Posez votre question en français...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;

    onSend(trimmed);
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t bg-background">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          className={cn(
            'w-full resize-none rounded-lg border bg-background px-4 py-3 pr-12',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-muted-foreground',
            'min-h-[48px] max-h-[200px]'
          )}
        />
        <div className="absolute right-2 bottom-2">
          {value.length > 0 && (
            <span className="text-xs text-muted-foreground mr-2">
              {value.length}/10000
            </span>
          )}
        </div>
      </div>

      {isStreaming ? (
        <Button
          onClick={onCancel}
          variant="destructive"
          size="icon"
          className="h-12 w-12 flex-shrink-0"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          size="icon"
          className="h-12 w-12 flex-shrink-0"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
