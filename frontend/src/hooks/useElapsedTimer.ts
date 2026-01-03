/**
 * Hook for real-time elapsed timer.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseElapsedTimerOptions {
  /** Update interval in ms (default: 100) */
  interval?: number;
}

interface UseElapsedTimerReturn {
  /** Elapsed time in milliseconds */
  elapsed: number;
  /** Formatted elapsed time string */
  formatted: string;
  /** Start the timer */
  start: () => void;
  /** Stop the timer */
  stop: () => void;
  /** Reset the timer */
  reset: () => void;
  /** Whether the timer is running */
  isRunning: boolean;
}

/**
 * Format milliseconds to a human-readable string.
 */
function formatElapsed(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
}

export function useElapsedTimer(
  options: UseElapsedTimerOptions = {}
): UseElapsedTimerReturn {
  const { interval = 100 } = options;

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number>();

  const start = useCallback(() => {
    if (isRunning) return;
    startTimeRef.current = Date.now() - elapsed;
    setIsRunning(true);
  }, [isRunning, elapsed]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
    startTimeRef.current = null;
  }, [stop]);

  useEffect(() => {
    if (isRunning && startTimeRef.current !== null) {
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsed(Date.now() - startTimeRef.current);
        }
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, interval]);

  return {
    elapsed,
    formatted: formatElapsed(elapsed),
    start,
    stop,
    reset,
    isRunning,
  };
}

/**
 * Hook for tracking elapsed time from a specific start time.
 */
export function useElapsedFromStart(
  startTime: Date | null,
  isActive: boolean
): number {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (isActive && startTime) {
      intervalRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startTime.getTime());
      }, 100);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startTime]);

  return elapsed;
}
