// Storage Context - Provides storage provider functionality to React components

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageContextType, StorageProvider, StorageProviderName, FileReference, StorageQuota } from '../types/storage';
import { StorageManager } from '../services/storage/StorageManager';
import { STORAGE_PROVIDERS } from '../config/storageProviders';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const StorageContext = createContext<StorageContextType | null>(null);

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};

interface StorageProviderProps {
  children: React.ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<StorageProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const storageManager = StorageManager.getInstance();

  // Initialize providers on mount and when user changes
  useEffect(() => {
    if (user) {
      initializeProviders();
    } else {
      // Clear providers when user logs out
      setProviders([]);
      setActiveProvider(null);
    }
  }, [user]);

  const initializeProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get provider configurations
      const providerConfigs = Object.values(STORAGE_PROVIDERS);
      const initialProviders: StorageProvider[] = [];

      // In mock mode, set up mock data
      if (storageManager.isMockMode()) {
        console.log('[StorageContext] Initializing mock providers');
        
        for (const config of providerConfigs) {
          // Skip disabled providers
          if (config.name === 'dropbox' || config.name === 'onedrive') {
            continue;
          }

          const provider: StorageProvider = {
            name: config.name,
            displayName: config.displayName,
            connected: false,
            isActive: false,
            connectionStatus: 'disconnected'
          };

          // Mock some connected providers
          if (config.name === 'supabase') {
            provider.connected = true;
            provider.isActive = true;
            provider.connectionStatus = 'connected';
            provider.email = user?.email || 'user@example.com';
            provider.quota = {
              used: 2.5 * 1024 * 1024 * 1024, // 2.5GB
              total: 10 * 1024 * 1024 * 1024, // 10GB
              unit: 'bytes'
            };
            provider.lastSync = new Date().toISOString();
          }

          initialProviders.push(provider);
        }
      } else {
        // Production mode: Load from database
        await loadProvidersFromDatabase(initialProviders);
      }

      setProviders(initialProviders);
      
      // Set active provider
      const active = initialProviders.find(p => p.isActive);
      setActiveProvider(active || null);

    } catch (error) {
      console.error('[StorageContext] Failed to initialize providers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, storageManager]);

  const loadProvidersFromDatabase = async (initialProviders: StorageProvider[]) => {
    if (!user) return;

    try {
      // Load user's storage providers from database
      const { data: userProviders, error } = await supabase
        .from('user_storage_providers')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('[StorageContext] Failed to load providers from database:', error);
        return;
      }

      // Convert database records to StorageProvider objects
      for (const config of Object.values(STORAGE_PROVIDERS)) {
        const dbProvider = userProviders?.find(p => p.provider === config.name);
        
        const provider: StorageProvider = {
          name: config.name,
          displayName: config.displayName,
          connected: !!dbProvider?.encrypted_access_token,
          isActive: dbProvider?.is_active || false,
          connectionStatus: dbProvider?.encrypted_access_token ? 'connected' : 'disconnected',
          email: dbProvider?.provider_email,
          quota: dbProvider?.storage_quota && dbProvider?.storage_used ? {
            used: dbProvider.storage_used,
            total: dbProvider.storage_quota,
            unit: 'bytes'
          } : undefined,
          lastSync: dbProvider?.updated_at
        };

        initialProviders.push(provider);
      }
    } catch (error) {
      console.error('[StorageContext] Database error:', error);
    }
  };

  const connectProvider = async (name: StorageProviderName): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Update UI immediately
      setProviders(prev => prev.map(p => 
        p.name === name 
          ? { ...p, connectionStatus: 'connecting' }
          : p
      ));

      if (storageManager.isMockMode()) {
        // Mock connection process
        await storageManager.connectProvider(name);
        
        // Simulate getting quota
        const quota = await storageManager.getQuota(name);
        
        // Update provider state
        setProviders(prev => prev.map(p => 
          p.name === name 
            ? { 
                ...p, 
                connected: true, 
                connectionStatus: 'connected',
                email: user?.email || 'user@example.com',
                quota: quota ? {
                  used: quota.used,
                  total: quota.total,
                  unit: 'bytes'
                } : undefined,
                lastSync: new Date().toISOString()
              }
            : p
        ));
      } else {
        // Production: Implement OAuth flow
        await connectProviderOAuth(name);
      }

    } catch (error) {
      console.error('[StorageContext] Connection failed:', error);
      
      // Update error state
      setProviders(prev => prev.map(p => 
        p.name === name 
          ? { 
              ...p, 
              connectionStatus: 'error',
              errorMessage: error instanceof Error ? error.message : 'Connection failed'
            }
          : p
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const connectProviderOAuth = async (name: StorageProviderName): Promise<void> => {
    // TODO: Implement OAuth flows for each provider
    switch (name) {
      case 'google_drive':
        // Implement Google OAuth
        throw new Error('Google Drive OAuth not yet implemented');
      case 'dropbox':
        // Implement Dropbox OAuth
        throw new Error('Dropbox OAuth not yet implemented');
      case 'onedrive':
        // Implement OneDrive OAuth
        throw new Error('OneDrive OAuth not yet implemented');
      default:
        throw new Error(`OAuth not supported for provider: ${name}`);
    }
  };

  const disconnectProvider = async (name: StorageProviderName): Promise<void> => {
    try {
      await storageManager.disconnectProvider(name);
      
      // Update state
      setProviders(prev => prev.map(p => 
        p.name === name 
          ? { 
              ...p, 
              connected: false, 
              connectionStatus: 'disconnected',
              isActive: false,
              email: undefined,
              quota: undefined,
              errorMessage: undefined
            }
          : p
      ));

      // If this was the active provider, clear it
      if (activeProvider?.name === name) {
        setActiveProvider(null);
      }

      // In production, also update database
      if (!storageManager.isMockMode() && user) {
        await supabase
          .from('user_storage_providers')
          .update({ 
            encrypted_access_token: null, 
            encrypted_refresh_token: null,
            is_active: false 
          })
          .eq('user_id', user.id)
          .eq('provider', name);
      }

    } catch (error) {
      console.error('[StorageContext] Disconnect failed:', error);
    }
  };

  const switchProvider = async (name: StorageProviderName): Promise<void> => {
    try {
      const provider = providers.find(p => p.name === name);
      if (!provider?.connected) {
        throw new Error(`Provider ${name} is not connected`);
      }

      await storageManager.setActiveProvider(name);
      
      // Update state
      setProviders(prev => prev.map(p => ({
        ...p,
        isActive: p.name === name
      })));

      setActiveProvider(provider);

      // In production, update database
      if (!storageManager.isMockMode() && user) {
        await supabase.rpc('switch_active_provider', { p_provider: name });
      }

    } catch (error) {
      console.error('[StorageContext] Switch provider failed:', error);
      throw error;
    }
  };

  const uploadFile = async (file: File, path?: string): Promise<FileReference> => {
    if (!activeProvider) {
      throw new Error('No active storage provider');
    }

    return await storageManager.uploadFile(file, path);
  };

  const refreshProviders = async (): Promise<void> => {
    await initializeProviders();
  };

  const getProviderQuota = async (name: StorageProviderName): Promise<StorageQuota | null> => {
    try {
      const provider = providers.find(p => p.name === name);
      if (!provider?.connected) {
        return null;
      }

      return await storageManager.getQuota(name);
    } catch (error) {
      console.error('[StorageContext] Failed to get quota:', error);
      return null;
    }
  };

  const contextValue: StorageContextType = {
    providers,
    activeProvider,
    isLoading,
    connectProvider,
    disconnectProvider,
    switchProvider,
    uploadFile,
    refreshProviders,
    getProviderQuota
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};