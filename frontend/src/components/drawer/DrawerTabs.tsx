/**
 * Tab navigation for the drawer.
 */

import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { DRAWER_TABS, type DrawerTabId } from '@/types/features';
import { Activity, Coins, Server } from 'lucide-react';

const TAB_ICONS: Record<DrawerTabId, React.ReactNode> = {
  timeline: <Activity className="h-3.5 w-3.5" />,
  tokens: <Coins className="h-3.5 w-3.5" />,
  servers: <Server className="h-3.5 w-3.5" />,
};

export function DrawerTabs() {
  const activeTab = useSettingsStore((s) => s.activeDrawerTab);
  const setActiveTab = useSettingsStore((s) => s.setActiveDrawerTab);

  return (
    <div className="flex gap-1" role="tablist">
      {DRAWER_TABS.filter((tab) => tab.enabled).map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 text-sm rounded-md transition-colors',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {TAB_ICONS[tab.id]}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
