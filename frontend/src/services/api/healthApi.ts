/**
 * Health API service.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { HealthResponse } from '@/types/mcp';

export interface ReadyResponse {
  status: 'ready' | 'not ready';
  reason?: string;
}

export const healthApi = {
  /**
   * Get aggregated health status.
   */
  getHealth: async (): Promise<HealthResponse> => {
    return apiClient.get<HealthResponse>(API_ENDPOINTS.health);
  },

  /**
   * Liveness probe.
   */
  getLive: async (): Promise<{ status: string }> => {
    return apiClient.get<{ status: string }>(API_ENDPOINTS.healthLive);
  },

  /**
   * Readiness probe.
   */
  getReady: async (): Promise<ReadyResponse> => {
    return apiClient.get<ReadyResponse>(API_ENDPOINTS.healthReady);
  },
};
