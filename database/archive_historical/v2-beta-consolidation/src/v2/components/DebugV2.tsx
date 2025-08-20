import React from 'react';
import { FEATURES } from '../../config/features';

/**
 * Debug component to verify V2 is active
 */
export default function DebugV2() {
  const envVar = import.meta.env.VITE_ENABLE_V2;
  const hostname = window.location.hostname;
  const isV2 = FEATURES.PROJECT_HIERARCHY;
  
  return (
    <div className="fixed bottom-4 right-4 bg-forest-main border border-accent-yellow rounded-lg p-4 z-50 max-w-sm">
      <h3 className="font-anton text-accent-yellow mb-2">V2 Debug Info</h3>
      <div className="font-quicksand text-xs text-silver space-y-1">
        <p>📍 Hostname: <span className="text-accent-coral">{hostname}</span></p>
        <p>🔧 VITE_ENABLE_V2: <span className="text-accent-coral">{envVar || 'undefined'}</span></p>
        <p>✅ V2 Active: <span className={isV2 ? 'text-green-400' : 'text-red-400'}>{isV2 ? 'YES' : 'NO'}</span></p>
        <p>🚀 Features: {Object.entries(FEATURES).filter(([_, v]) => v).map(([k]) => k).join(', ')}</p>
      </div>
    </div>
  );
}