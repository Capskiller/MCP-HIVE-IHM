export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'MCP-HIVE SmartHub',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'fr',
  enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
};

export const SUGGESTED_QUESTIONS = [
  {
    id: 'q1',
    text: 'Combien y a-t-il de bases de données dans Hive ?',
    category: 'discovery',
  },
  {
    id: 'q2',
    text: 'Quelles sont les tables disponibles dans regen_db ?',
    category: 'discovery',
  },
  {
    id: 'q3',
    text: "Quel est le montant total des engagements pour Action Coeur de Ville ?",
    category: 'analytics',
  },
  {
    id: 'q4',
    text: "Combien d'opérations sont au statut 'Engagé' ?",
    category: 'analytics',
  },
  {
    id: 'q5',
    text: 'Top 10 des opérations par montant global',
    category: 'analytics',
  },
  {
    id: 'q6',
    text: "Donne-moi la fiche de cotation de l'engagement 42",
    category: 'cotation',
  },
];

export const API_ENDPOINTS = {
  chat: '/chat',
  chatStream: '/chat/stream',
  chatHistory: (id: string) => `/chat/${id}/history`,
  chatDelete: (id: string) => `/chat/${id}`,
  health: '/health',
  healthLive: '/health/live',
  healthReady: '/health/ready',
  models: '/models',
  modelsInstalled: '/models/installed',
  modelInfo: (name: string) => `/models/${name}`,
  modelPull: (name: string) => `/models/${name}/pull`,
};
