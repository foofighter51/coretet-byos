import React from 'react';
import { StorageProvider } from '../../types/storage';
import { STORAGE_PROVIDERS, PROVIDER_COLORS } from '../../config/storageProviders';

interface ProviderCardProps {
  provider: StorageProvider;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSetActive: () => Promise<void>;
  disabled?: boolean;
}

export function ProviderCard({ 
  provider, 
  onConnect, 
  onDisconnect, 
  onSetActive,
  disabled = false 
}: ProviderCardProps) {
  const config = STORAGE_PROVIDERS[provider.name];
  const colorClass = PROVIDER_COLORS[provider.name];
  
  const getStatusText = () => {
    switch (provider.connectionStatus) {
      case 'connected': return provider.isActive ? 'Active' : 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Not connected';
    }
  };

  const getQuotaPercentage = () => {
    if (!provider.quota) return 0;
    return Math.round((provider.quota.used / provider.quota.total) * 100);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className={`storage-provider-card ${provider.connected ? 'connected' : ''} ${provider.connectionStatus === 'connecting' ? 'connecting' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`provider-logo ${provider.name} ${colorClass} flex items-center justify-center text-white text-lg`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-quicksand font-semibold text-white text-lg">
              {config.displayName}
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`provider-status-dot ${provider.connectionStatus}`}></div>
              <span className="text-sm text-gray-400">{getStatusText()}</span>
              {provider.isActive && (
                <span className="text-xs bg-yellow-500 text-gray-900 px-2 py-1 rounded-full font-medium">
                  ACTIVE
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          {provider.connected ? (
            <>
              {!provider.isActive && (
                <button
                  onClick={onSetActive}
                  disabled={disabled}
                  className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  Set Active
                </button>
              )}
              <button
                onClick={onDisconnect}
                disabled={disabled}
                className="px-3 py-1 text-sm border border-gray-600 hover:border-gray-500 text-gray-300 rounded-md transition-colors disabled:opacity-50"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              disabled={disabled || provider.connectionStatus === 'connecting'}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {provider.connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 font-quicksand">
        {config.description}
      </p>

      {/* Features */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {config.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Storage Usage */}
      {provider.connected && provider.quota && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Storage Used</span>
            <span className="text-gray-300">
              {formatBytes(provider.quota.used)} / {formatBytes(provider.quota.total)}
            </span>
          </div>
          <div className="storage-usage-bar">
            <div 
              className={`storage-usage-fill ${getQuotaPercentage() > 80 ? 'warning' : ''} ${getQuotaPercentage() > 95 ? 'critical' : ''}`}
              style={{ width: `${getQuotaPercentage()}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">
            {getQuotaPercentage()}% used
          </div>
        </div>
      )}

      {/* Connection Info */}
      {provider.connected && provider.email && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            Connected as: <span className="text-gray-300">{provider.email}</span>
          </div>
          {provider.lastSync && (
            <div className="text-xs text-gray-500">
              Last sync: {new Date(provider.lastSync).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {provider.connectionStatus === 'error' && provider.errorMessage && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
          <div className="text-sm text-red-400">
            {provider.errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}