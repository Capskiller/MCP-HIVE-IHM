/**
 * Draggable handle for resizing the drawer.
 */

import { cn } from '@/lib/utils';
import { GripHorizontal } from 'lucide-react';

interface DrawerHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export function DrawerHandle({ onMouseDown, isDragging }: DrawerHandleProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center h-2 cursor-ns-resize',
        'hover:bg-primary/10 transition-colors',
        isDragging && 'bg-primary/20'
      )}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize drawer"
    >
      <GripHorizontal className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}
