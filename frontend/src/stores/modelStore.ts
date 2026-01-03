/**
 * Model store for managing LLM model selection.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Model, ModelStatus } from '@/types/mcp';

interface ModelState {
  /** Currently selected model */
  selectedModel: string | null;

  /** List of installed models */
  installedModels: Model[];

  /** Model loading status */
  modelStatus: Record<string, ModelStatus>;

  /** Pull progress for models being downloaded */
  pullProgress: Record<string, number>;

  // Actions
  setSelectedModel: (model: string) => void;
  setInstalledModels: (models: Model[]) => void;
  setModelStatus: (modelName: string, status: ModelStatus) => void;
  updatePullProgress: (modelName: string, progress: number) => void;
  clearPullProgress: (modelName: string) => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      selectedModel: null,
      installedModels: [],
      modelStatus: {},
      pullProgress: {},

      setSelectedModel: (model) => {
        set({ selectedModel: model });
      },

      setInstalledModels: (models) => {
        set((state) => {
          // Auto-select first model if none selected
          const selectedModel =
            state.selectedModel && models.some((m) => m.name === state.selectedModel)
              ? state.selectedModel
              : models[0]?.name || null;

          return { installedModels: models, selectedModel };
        });
      },

      setModelStatus: (modelName, status) => {
        set((state) => ({
          modelStatus: { ...state.modelStatus, [modelName]: status },
        }));
      },

      updatePullProgress: (modelName, progress) => {
        set((state) => ({
          pullProgress: { ...state.pullProgress, [modelName]: progress },
        }));
      },

      clearPullProgress: (modelName) => {
        set((state) => {
          const { [modelName]: _, ...rest } = state.pullProgress;
          return { pullProgress: rest };
        });
      },
    }),
    {
      name: 'mcp-hive-model-store',
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    }
  )
);
