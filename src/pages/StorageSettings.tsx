import React from 'react';
import { ProviderCard } from '../components/Storage/ProviderCard';
import { STORAGE_PROVIDERS } from '../config/storageProviders';
import { useStorage } from '../contexts/StorageContext';
import '../styles/byos-components.css';

export function StorageSettings() {
  const { 
    providers, 
    activeProvider, 
    isLoading, 
    connectProvider, 
    disconnectProvider, 
    switchProvider 
  } = useStorage();

  const handleConnect = async (providerName: string) => {
    try {
      await connectProvider(providerName as any);
    } catch (error) {
      console.error('Failed to connect provider:', error);
    }
  };

  const handleDisconnect = async (providerName: string) => {
    try {
      await disconnectProvider(providerName as any);
    } catch (error) {
      console.error('Failed to disconnect provider:', error);
    }
  };

  const handleSetActive = async (providerName: string) => {
    try {
      await switchProvider(providerName as any);
    } catch (error) {
      console.error('Failed to switch provider:', error);
    }
  };

  const connectedProviders = providers.filter(p => p.connected);
  const totalUsedSpace = connectedProviders.reduce((total, p) => 
    total + (p.quota?.used || 0), 0
  );

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-anton text-white mb-2">
                Storage Settings
              </h1>
              <p className="text-gray-400 font-quicksand">
                Connect your cloud storage providers to store and stream your music files
              </p>
            </div>
            
            {/* Overview Stats */}
            <div className="text-right">
              <div className="text-2xl font-anton text-yellow-400">
                {connectedProviders.length}
              </div>
              <div className="text-sm text-gray-400">
                Connected Providers
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatBytes(totalUsedSpace)} total used
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Active Provider Banner */}
        {activeProvider && (
          <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <span className="text-yellow-400 font-medium">Active Storage Provider: </span>
                <span className="text-white">{STORAGE_PROVIDERS[activeProvider.name].displayName}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              New uploads will be stored in {STORAGE_PROVIDERS[activeProvider.name].displayName}
            </p>
          </div>
        )}

        {/* Providers Grid */}
        <div className="storage-settings-grid">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.name}
              provider={provider}
              onConnect={() => handleConnect(provider.name)}
              onDisconnect={() => handleDisconnect(provider.name)}
              onSetActive={() => handleSetActive(provider.name)}
              disabled={isLoading}
            />
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-xl font-quicksand font-semibold text-white mb-4">
            Getting Started with BYOS
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">1. Connect a Provider</h4>
              <p className="text-gray-400 text-sm">
                Choose your preferred cloud storage and connect it to CoreTet. We recommend starting with Google Drive for the best experience.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">2. Upload Your Music</h4>
              <p className="text-gray-400 text-sm">
                Once connected, all new uploads will be stored in your chosen provider while keeping metadata in CoreTet.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">3. Stream Anywhere</h4>
              <p className="text-gray-400 text-sm">
                Access your music from any device while maintaining full control over your files in your own storage.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">4. Migrate Existing Files</h4>
              <p className="text-gray-400 text-sm">
                Use our migration tool to move existing tracks from CoreTet storage to your preferred provider.
              </p>
            </div>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400 font-medium text-sm">BETA FEATURE</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            BYOS is currently in beta. Your existing CoreTet storage remains safe and accessible. 
            Report any issues to help us improve the experience.
          </p>
        </div>
      </div>
    </div>
  );
}