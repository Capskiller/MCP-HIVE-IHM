/**
 * React Query hooks for health monitoring.
 */

import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/services/api/healthApi';
import type { HealthResponse, ComponentHealthStatus } from '@/types/mcp';

/**
 * Hook to fetch system health status.
 */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: healthApi.getHealth,
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 30, // Poll every 30s
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to check readiness.
 */
export function useHealthReady() {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: healthApi.getReady,
    staleTime: 1000 * 5, // 5 seconds
  });
}

/**
 * Hook to get overall system status.
 */
export function useSystemStatus(): {
  status: ComponentHealthStatus;
  isLoading: boolean;
  components: HealthResponse['components'] | undefined;
} {
  const { data, isLoading } = useHealth();

  return {
    status: data?.status ?? 'degraded',
    isLoading,
    components: data?.components,
  };
}
