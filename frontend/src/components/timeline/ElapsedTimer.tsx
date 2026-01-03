/**
 * Real-time elapsed timer component.
 */

import { useElapsedFromStart } from '@/hooks/useElapsedTimer';

interface ElapsedTimerProps {
  startTime: Date;
  className?: string;
}

export function ElapsedTimer({ startTime, className }: ElapsedTimerProps) {
  const elapsed = useElapsedFromStart(startTime, true);

  const formatted = elapsed < 1000
    ? `${elapsed}ms`
    : `${(elapsed / 1000).toFixed(1)}s`;

  return (
    <span className={className}>
      {formatted}
    </span>
  );
}
