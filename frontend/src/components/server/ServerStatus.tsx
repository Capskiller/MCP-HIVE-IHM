/**
 * MCP Server status panel.
 */

import { useMcpServers, useEnabledServers } from '@/hooks/useMcpServers';
import { ServerCard } from './ServerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Server, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ServerStatus() {
  const { data: servers, isLoading, refetch, isRefetching } = useMcpServers();
  const { enabledServers } = useEnabledServers();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Server className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No MCP servers configured</p>
        <p className="text-xs mt-1">Check your server configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">Active: </span>
          <span className="font-medium">
            {enabledServers.length} / {servers.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1 ${isRefetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Server cards */}
      <div className="space-y-2">
        {servers.map((server) => (
          <ServerCard key={server.name} server={server} />
        ))}
      </div>
    </div>
  );
}
