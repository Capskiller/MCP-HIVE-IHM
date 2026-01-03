/**
 * Individual MCP server card.
 */

import { cn } from '@/lib/utils';
import { useToggleMcpServer } from '@/hooks/useMcpServers';
import { useMcpStore } from '@/stores/mcpStore';
import type { McpServer } from '@/types/mcp';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Server, Wrench } from 'lucide-react';

interface ServerCardProps {
  server: McpServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const isServerEnabled = useMcpStore((s) => s.isServerEnabled);
  const { mutate: toggleServer, isPending } = useToggleMcpServer();

  const enabled = isServerEnabled(server.name);

  const handleToggle = (checked: boolean) => {
    toggleServer({ serverName: server.name, enabled: checked });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        enabled && server.connected && 'border-green-500/30 bg-green-500/5',
        enabled && !server.connected && 'border-red-500/30 bg-red-500/5',
        !enabled && 'opacity-60'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'p-2 rounded-md',
          server.connected ? 'bg-green-500/10' : 'bg-muted'
        )}
      >
        <Server
          className={cn(
            'h-4 w-4',
            server.connected ? 'text-green-500' : 'text-muted-foreground'
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{server.name}</span>
          <Badge
            variant={server.connected ? 'default' : 'secondary'}
            className="text-xs"
          >
            {server.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Wrench className="h-3 w-3" />
          <span>{server.toolsCount} tools</span>
          <span className="mx-1">·</span>
          <span>{server.transport}</span>
        </div>
      </div>

      {/* Toggle */}
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${server.name}`}
      />
    </div>
  );
}
