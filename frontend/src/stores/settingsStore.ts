/**
 * Settings store for UI preferences and feature flags.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeatureFlags, DrawerTabId } from '@/types/features';
import { DEFAULT_FEATURE_FLAGS } from '@/types/features';

interface SettingsState {
  // Drawer settings
  drawerHeight: number;
  drawerMinimized: boolean;
  activeDrawerTab: DrawerTabId;

  // Feature flags
  featureFlags: FeatureFlags;

  // Theme (in addition to existing theme toggle)
  debugMode: boolean;

  // Actions
  setDrawerHeight: (height: number) => void;
  toggleDrawer: () => void;
  setDrawerMinimized: (minimized: boolean) => void;
  setActiveDrawerTab: (tab: DrawerTabId) => void;
  updateFeatureFlag: <K extends keyof FeatureFlags>(
    flag: K,
    value: FeatureFlags[K]
  ) => void;
  resetFeatureFlags: () => void;
  setDebugMode: (enabled: boolean) => void;
}

const DEFAULT_DRAWER_HEIGHT = 200;
const MIN_DRAWER_HEIGHT = 100;
const MAX_DRAWER_HEIGHT = 500;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      drawerHeight: DEFAULT_DRAWER_HEIGHT,
      drawerMinimized: false,
      activeDrawerTab: 'timeline',
      featureFlags: DEFAULT_FEATURE_FLAGS,
      debugMode: false,

      setDrawerHeight: (height) => {
        const clampedHeight = Math.min(MAX_DRAWER_HEIGHT, Math.max(MIN_DRAWER_HEIGHT, height));
        set({ drawerHeight: clampedHeight });
      },

      toggleDrawer: () => {
        set((state) => ({ drawerMinimized: !state.drawerMinimized }));
      },

      setDrawerMinimized: (minimized) => {
        set({ drawerMinimized: minimized });
      },

      setActiveDrawerTab: (tab) => {
        set({ activeDrawerTab: tab });
      },

      updateFeatureFlag: (flag, value) => {
        set((state) => ({
          featureFlags: { ...state.featureFlags, [flag]: value },
        }));
      },

      resetFeatureFlags: () => {
        set({ featureFlags: DEFAULT_FEATURE_FLAGS });
      },

      setDebugMode: (enabled) => {
        set({ debugMode: enabled });
      },
    }),
    {
      name: 'mcp-hive-settings',
      partialize: (state) => ({
        drawerHeight: state.drawerHeight,
        drawerMinimized: state.drawerMinimized,
        activeDrawerTab: state.activeDrawerTab,
        featureFlags: state.featureFlags,
        debugMode: state.debugMode,
      }),
    }
  )
);

// Export constants for components
export { DEFAULT_DRAWER_HEIGHT, MIN_DRAWER_HEIGHT, MAX_DRAWER_HEIGHT };
