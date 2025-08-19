/**
 * Feature flags for CoreTet V2
 * Control which features are enabled in different environments
 */

// Check if we're in V2 mode
const isV2Mode = import.meta.env.VITE_ENABLE_V2 === 'true' || 
                 window.location.hostname === 'beta.coretet.app' ||
                 window.location.hostname.includes('coretet-beta') ||
                 window.location.hostname.includes('netlify');

// Individual feature flags
export const FEATURES = {
  // V2 Core Features
  PROJECT_HIERARCHY: isV2Mode,
  VERSION_SYSTEM: isV2Mode,
  COLLABORATION: isV2Mode && import.meta.env.VITE_ENABLE_COLLAB !== 'false',
  AI_ANALYSIS: isV2Mode && import.meta.env.VITE_ENABLE_AI === 'true',
  
  // Specific V2 Features (can be toggled individually)
  TIMESTAMPED_COMMENTS: isV2Mode,
  VERSION_COMPARISON: isV2Mode,
  REAL_TIME_PRESENCE: isV2Mode && import.meta.env.VITE_ENABLE_PRESENCE === 'true',
  SMART_SEARCH: isV2Mode && import.meta.env.VITE_ENABLE_SMART_SEARCH === 'true',
  AUTO_TAGGING: isV2Mode && import.meta.env.VITE_ENABLE_AUTO_TAG === 'true',
  
  // UI Variations
  KANBAN_VIEW: isV2Mode,
  TIMELINE_VIEW: isV2Mode,
  GRAPH_VIEW: isV2Mode && import.meta.env.VITE_ENABLE_GRAPH === 'true',
  
  // Migration Features
  SHOW_MIGRATION_PROMPT: isV2Mode && import.meta.env.VITE_SHOW_MIGRATION === 'true',
  ALLOW_V1_FALLBACK: true, // Users can switch back to V1
} as const;

// Helper to check if any V2 features are enabled
export const isV2Enabled = () => Object.values(FEATURES).some(flag => flag === true);

// Helper to get feature flag safely
export const getFeature = (featureName: keyof typeof FEATURES): boolean => {
  return FEATURES[featureName] || false;
};

// Development helpers
if (import.meta.env.DEV) {
  // Log active features in development
  console.log('🚀 CoreTet Feature Flags:', {
    VITE_ENABLE_V2: import.meta.env.VITE_ENABLE_V2,
    hostname: window.location.hostname,
    isV2Mode: isV2Mode,
    mode: isV2Mode ? 'V2' : 'V1',
    PROJECT_HIERARCHY: FEATURES.PROJECT_HIERARCHY,
    features: Object.entries(FEATURES)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)
  });
  
  // Expose to window for debugging
  (window as any).__CORETET_FEATURES__ = FEATURES;
}