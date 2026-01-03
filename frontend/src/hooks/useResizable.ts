/**
 * Hook for resizable drawer functionality.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizableOptions {
  minHeight: number;
  maxHeight: number;
  defaultHeight: number;
  onResize?: (height: number) => void;
}

interface UseResizableReturn {
  height: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  setHeight: (height: number) => void;
}

export function useResizable(options: UseResizableOptions): UseResizableReturn {
  const { minHeight, maxHeight, defaultHeight, onResize } = options;

  const [height, setHeightState] = useState(defaultHeight);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const setHeight = useCallback(
    (newHeight: number) => {
      const clampedHeight = Math.min(maxHeight, Math.max(minHeight, newHeight));
      setHeightState(clampedHeight);
      onResize?.(clampedHeight);
    },
    [minHeight, maxHeight, onResize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startY.current = e.clientY;
      startHeight.current = height;
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    },
    [height]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      // Dragging up increases height (negative deltaY)
      const deltaY = startY.current - e.clientY;
      const newHeight = startHeight.current + deltaY;
      setHeight(newHeight);
    },
    [isDragging, setHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    height,
    isDragging,
    handleMouseDown,
    setHeight,
  };
}
