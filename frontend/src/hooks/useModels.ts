/**
 * React Query hooks for model management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelsApi } from '@/services/api/modelsApi';
import { useModelStore } from '@/stores/modelStore';
import { useEffect } from 'react';

/**
 * Hook to fetch and cache installed models.
 */
export function useModels() {
  const setInstalledModels = useModelStore((s) => s.setInstalledModels);

  const query = useQuery({
    queryKey: ['models', 'installed'],
    queryFn: modelsApi.getInstalled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Sync to store when data changes
  useEffect(() => {
    if (query.data?.models) {
      setInstalledModels(query.data.models);
    }
  }, [query.data, setInstalledModels]);

  return query;
}

/**
 * Hook to fetch model information.
 */
export function useModelInfo(modelName: string | null) {
  return useQuery({
    queryKey: ['models', modelName],
    queryFn: () => (modelName ? modelsApi.getInfo(modelName) : null),
    enabled: !!modelName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to pull/download a model.
 */
export function usePullModel() {
  const queryClient = useQueryClient();
  const { updatePullProgress, clearPullProgress, setModelStatus } = useModelStore();

  return useMutation({
    mutationFn: async (modelName: string) => {
      setModelStatus(modelName, 'pulling');

      return new Promise<void>((resolve, reject) => {
        const eventSource = modelsApi.pull(modelName);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.completed && data.total) {
              const progress = Math.round((data.completed / data.total) * 100);
              updatePullProgress(modelName, progress);
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          clearPullProgress(modelName);
          setModelStatus(modelName, 'error');
          reject(new Error('Failed to pull model'));
        };

        eventSource.addEventListener('done', () => {
          eventSource.close();
          clearPullProgress(modelName);
          setModelStatus(modelName, 'available');
          resolve();
        });
      });
    },
    onSuccess: () => {
      // Refresh models list
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
}

/**
 * Hook to get the currently selected model.
 */
export function useSelectedModel() {
  const selectedModel = useModelStore((s) => s.selectedModel);
  const setSelectedModel = useModelStore((s) => s.setSelectedModel);
  const installedModels = useModelStore((s) => s.installedModels);

  return {
    selectedModel,
    setSelectedModel,
    installedModels,
  };
}
