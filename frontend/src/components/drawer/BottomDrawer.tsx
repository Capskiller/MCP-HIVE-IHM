/**
 * Resizable bottom drawer for technical details.
 */

import { cn } from '@/lib/utils';
import { useSettingsStore, MIN_DRAWER_HEIGHT, MAX_DRAWER_HEIGHT } from '@/stores/settingsStore';
import { useResizable } from '@/hooks/useResizable';
import { DrawerHandle } from './DrawerHandle';
import { DrawerTabs } from './DrawerTabs';
import { McpTimeline } from '@/components/timeline/McpTimeline';
import { TokenSummary } from '@/components/tokens/TokenSummary';
import { ServerStatus } from '@/components/server/ServerStatus';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomDrawer() {
  const drawerHeight = useSettingsStore((s) => s.drawerHeight);
  const drawerMinimized = useSettingsStore((s) => s.drawerMinimized);
  const activeTab = useSettingsStore((s) => s.activeDrawerTab);
  const setDrawerHeight = useSettingsStore((s) => s.setDrawerHeight);
  const toggleDrawer = useSettingsStore((s) => s.toggleDrawer);

  const { height, isDragging, handleMouseDown } = useResizable({
    minHeight: MIN_DRAWER_HEIGHT,
    maxHeight: MAX_DRAWER_HEIGHT,
    defaultHeight: drawerHeight,
    onResize: setDrawerHeight,
  });

  const displayHeight = drawerMinimized ? 40 : height;

  return (
    <div
      className={cn(
        'flex flex-col border-t bg-background transition-[height] duration-200',
        isDragging && 'transition-none'
      )}
      style={{ height: displayHeight }}
    >
      {/* Resize Handle */}
      {!drawerMinimized && (
        <DrawerHandle onMouseDown={handleMouseDown} isDragging={isDragging} />
      )}

      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b px-2 h-10 shrink-0">
        {drawerMinimized ? (
          <span className="text-sm text-muted-foreground px-2">
            Technical Details
          </span>
        ) : (
          <DrawerTabs />
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggleDrawer}
          aria-label={drawerMinimized ? 'Expand drawer' : 'Minimize drawer'}
        >
          {drawerMinimized ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      {!drawerMinimized && (
        <div className="flex-1 overflow-auto p-2">
          {activeTab === 'timeline' && <McpTimeline />}
          {activeTab === 'tokens' && <TokenSummary />}
          {activeTab === 'servers' && <ServerStatus />}
        </div>
      )}
    </div>
  );
}
