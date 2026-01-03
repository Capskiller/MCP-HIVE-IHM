/**
 * MCP Store for managing MCP server connections and selection.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { McpServer, McpServerStatus } from '@/types/mcp';

interface McpState {
  /** All registered MCP servers */
  servers: McpServer[];

  /** Server enable/disable configuration (persisted) */
  serverConfigs: Record<string, boolean>;

  /** Connection status per server */
  connectionStatus: Record<string, McpServerStatus>;

  // Actions
  setServers: (servers: McpServer[]) => void;
  toggleServer: (serverName: string, enabled: boolean) => void;
  setConnectionStatus: (serverName: string, status: McpServerStatus) => void;
  getEnabledServers: () => McpServer[];
  isServerEnabled: (serverName: string) => boolean;
}

export const useMcpStore = create<McpState>()(
  persist(
    (set, get) => ({
      servers: [],
      serverConfigs: {},
      connectionStatus: {},

      setServers: (servers) => {
        set((state) => {
          // Initialize configs for new servers
          const serverConfigs = { ...state.serverConfigs };
          const connectionStatus = { ...state.connectionStatus };

          servers.forEach((server) => {
            if (!(server.name in serverConfigs)) {
              serverConfigs[server.name] = server.enabled;
            }
            connectionStatus[server.name] = server.connected
              ? 'connected'
              : 'disconnected';
          });

          return { servers, serverConfigs, connectionStatus };
        });
      },

      toggleServer: (serverName, enabled) => {
        set((state) => ({
          serverConfigs: { ...state.serverConfigs, [serverName]: enabled },
        }));
      },

      setConnectionStatus: (serverName, status) => {
        set((state) => ({
          connectionStatus: { ...state.connectionStatus, [serverName]: status },
        }));
      },

      getEnabledServers: () => {
        const state = get();
        return state.servers.filter(
          (server) => state.serverConfigs[server.name] !== false
        );
      },

      isServerEnabled: (serverName) => {
        const state = get();
        return state.serverConfigs[serverName] !== false;
      },
    }),
    {
      name: 'mcp-hive-mcp-store',
      partialize: (state) => ({ serverConfigs: state.serverConfigs }),
    }
  )
);
