/**
 * Feature flags and extensibility types.
 */

// ===========================================
// Feature Flags
// ===========================================

export interface FeatureFlags {
  /** Enable RAG (Retrieval Augmented Generation) */
  ragEnabled: boolean;
  /** Enable sub-agents support */
  subAgentsEnabled: boolean;
  /** Allow model switching mid-conversation */
  modelSwitchingMidConversation: boolean;
  /** Enable benchmark feature */
  benchmarkEnabled: boolean;
  /** Enable data export (CSV, Excel) */
  exportEnabled: boolean;
  /** Enable debug mode with extra logging */
  debugMode: boolean;
}

export type FeatureFlagKey = keyof FeatureFlags;

// Default feature flags
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  ragEnabled: false,
  subAgentsEnabled: false,
  modelSwitchingMidConversation: true,
  benchmarkEnabled: false,
  exportEnabled: true,
  debugMode: false,
};

// ===========================================
// Drawer Configuration
// ===========================================

export type DrawerTabId = 'timeline' | 'tokens' | 'servers';

export interface DrawerTab {
  id: DrawerTabId;
  label: string;
  enabled: boolean;
}

export const DRAWER_TABS: DrawerTab[] = [
  { id: 'timeline', label: 'Timeline', enabled: true },
  { id: 'tokens', label: 'Tokens', enabled: true },
  { id: 'servers', label: 'Serveurs', enabled: true },
];

// ===========================================
// Extensibility Types
// ===========================================

export interface ExtensionPoint {
  id: string;
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}
