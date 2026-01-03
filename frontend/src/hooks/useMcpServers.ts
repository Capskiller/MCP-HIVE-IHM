/**
 * React Query hooks for MCP server management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcpApi } from '@/services/api/mcpApi';
import { useMcpStore } from '@/stores/mcpStore';
import { useEffect } from 'react';

/**
 * Hook to fetch and cache MCP servers.
 */
export function useMcpServers() {
  const setServers = useMcpStore((s) => s.setServers);

  const query = useQuery({
    queryKey: ['mcp', 'servers'],
    queryFn: mcpApi.getServers,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll every 30s
    refetchOnWindowFocus: true,
  });

  // Sync to store when data changes
  useEffect(() => {
    if (query.data) {
      setServers(query.data);
    }
  }, [query.data, setServers]);

  return query;
}

/**
 * Hook to toggle MCP server enabled/disabled status.
 */
export function useToggleMcpServer() {
  const queryClient = useQueryClient();
  const toggleServer = useMcpStore((s) => s.toggleServer);

  return useMutation({
    mutationFn: async ({
      serverName,
      enabled,
    }: {
      serverName: string;
      enabled: boolean;
    }) => {
      return mcpApi.toggleServer(serverName, enabled);
    },
    onMutate: async ({ serverName, enabled }) => {
      // Optimistic update
      toggleServer(serverName, enabled);
    },
    onSuccess: () => {
      // Refresh servers list
      queryClient.invalidateQueries({ queryKey: ['mcp', 'servers'] });
    },
    onError: (_, { serverName, enabled }) => {
      // Rollback on error
      toggleServer(serverName, !enabled);
    },
  });
}

/**
 * Hook to get tools for a specific server.
 */
export function useMcpServerTools(serverName: string | null) {
  return useQuery({
    queryKey: ['mcp', 'servers', serverName, 'tools'],
    queryFn: () => (serverName ? mcpApi.getServerTools(serverName) : null),
    enabled: !!serverName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get enabled servers.
 */
export function useEnabledServers() {
  const servers = useMcpStore((s) => s.servers);
  const getEnabledServers = useMcpStore((s) => s.getEnabledServers);
  const isServerEnabled = useMcpStore((s) => s.isServerEnabled);

  return {
    servers,
    enabledServers: getEnabledServers(),
    isServerEnabled,
  };
}
