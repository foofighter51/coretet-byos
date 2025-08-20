// Simplified Storage Context for debugging

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageContextType, StorageProvider as StorageProviderType, StorageProviderName } from '../types/storage';
import { GoogleDriveProvider } from '../services/storage/providers/GoogleDriveProvider';

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
  const [providers, setProviders] = useState<StorageProviderType[]>([
    {
      name: 'google_drive',
      displayName: 'Google Drive',
      connected: false,
      connectionStatus: 'disconnected'
    },
    {
      name: 'dropbox',
      displayName: 'Dropbox',
      connected: false,
      connectionStatus: 'disconnected'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const googleProvider = new GoogleDriveProvider();

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const googleConnected = await googleProvider.isConnected();
      setProviders(prev => prev.map(p => 
        p.name === 'google_drive' 
          ? { ...p, connected: googleConnected, connectionStatus: googleConnected ? 'connected' : 'disconnected' }
          : p
      ));
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const activeProvider = providers.find(p => p.isActive) || null;

  const connectProvider = async (name: StorageProviderName): Promise<void> => {
    setIsLoading(true);
    try {
      if (name === 'google_drive') {
        const success = await googleProvider.connect();
        if (success) {
          setProviders(prev => prev.map(p => 
            p.name === 'google_drive' 
              ? { ...p, connected: true, connectionStatus: 'connected', isActive: true }
              : { ...p, isActive: false } // Deactivate other providers
          ));
        }
      } else {
        console.log('Provider not implemented yet:', name);
      }
    } catch (error) {
      console.error('Failed to connect provider:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectProvider = async (name: StorageProviderName): Promise<void> => {
    setIsLoading(true);
    try {
      if (name === 'google_drive') {
        await googleProvider.disconnect();
        setProviders(prev => prev.map(p => 
          p.name === 'google_drive' 
            ? { ...p, connected: false, connectionStatus: 'disconnected', isActive: false }
            : p
        ));
      } else {
        console.log('Provider not implemented yet:', name);
      }
    } catch (error) {
      console.error('Failed to disconnect provider:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const switchProvider = async (name: StorageProviderName): Promise<void> => {
    setProviders(prev => prev.map(p => ({
      ...p,
      isActive: p.name === name && p.connected
    })));
  };

  const uploadFile = async (file: File, path?: string) => {
    throw new Error('Upload not implemented in simplified context');
  };

  const refreshProviders = async (): Promise<void> => {
    console.log('Refresh providers');
  };

  const getProviderQuota = async (name: StorageProviderName) => {
    if (name === 'google_drive' && providers.find(p => p.name === 'google_drive')?.connected) {
      try {
        return await googleProvider.getQuota();
      } catch (error) {
        console.error('Error getting Google Drive quota:', error);
      }
    }
    return null;
  };

  const getProviderInstance = (name: StorageProviderName) => {
    if (name === 'google_drive') {
      return googleProvider;
    }
    return null;
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
    getProviderQuota,
    getProviderInstance
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};