/**
 * MCP Servers API service.
 */

import { apiClient } from './client';
import type { McpServer } from '@/types/mcp';

// API endpoints for MCP servers
const MCP_ENDPOINTS = {
  servers: '/mcp/servers',
  serverToggle: (name: string) => `/mcp/servers/${name}/toggle`,
  serverTools: (name: string) => `/mcp/servers/${name}/tools`,
};

export interface McpServerToggleRequest {
  enabled: boolean;
}

export interface McpServerToggleResponse {
  server: string;
  enabled: boolean;
  status: string;
}

export interface McpServerToolsResponse {
  server: string;
  tools: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
    server_name: string;
  }>;
}

export const mcpApi = {
  /**
   * Get list of registered MCP servers.
   */
  getServers: async (): Promise<McpServer[]> => {
    return apiClient.get<McpServer[]>(MCP_ENDPOINTS.servers);
  },

  /**
   * Toggle server enabled/disabled status.
   */
  toggleServer: async (
    serverName: string,
    enabled: boolean
  ): Promise<McpServerToggleResponse> => {
    return apiClient.post<McpServerToggleResponse>(
      MCP_ENDPOINTS.serverToggle(serverName),
      { enabled }
    );
  },

  /**
   * Get tools available on a specific server.
   */
  getServerTools: async (serverName: string): Promise<McpServerToolsResponse> => {
    return apiClient.get<McpServerToolsResponse>(MCP_ENDPOINTS.serverTools(serverName));
  },
};
