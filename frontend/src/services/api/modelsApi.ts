/**
 * Models API service.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Model } from '@/types/mcp';

export interface ModelsListResponse {
  models: Model[];
}

export interface ModelInfoResponse {
  modelfile?: string;
  parameters?: string;
  template?: string;
  details?: Record<string, unknown>;
}

export const modelsApi = {
  /**
   * Get list of installed models.
   */
  getInstalled: async (): Promise<ModelsListResponse> => {
    return apiClient.get<ModelsListResponse>(API_ENDPOINTS.modelsInstalled);
  },

  /**
   * Get all available models.
   */
  getAll: async (): Promise<ModelsListResponse> => {
    return apiClient.get<ModelsListResponse>(API_ENDPOINTS.models);
  },

  /**
   * Get model information.
   */
  getInfo: async (modelName: string): Promise<ModelInfoResponse> => {
    return apiClient.get<ModelInfoResponse>(API_ENDPOINTS.modelInfo(modelName));
  },

  /**
   * Pull/download a model.
   * Returns an EventSource for streaming progress.
   */
  pull: (modelName: string): EventSource => {
    const url = `${import.meta.env.VITE_API_BASE_URL || ''}${API_ENDPOINTS.modelPull(modelName)}`;
    return new EventSource(url);
  },
};
