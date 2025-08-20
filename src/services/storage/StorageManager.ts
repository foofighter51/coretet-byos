// Storage Manager - Coordinates multiple storage providers

import { IStorageProvider, StorageProviderName, FileReference, StorageQuota } from '../../types/storage';
import { MockProvider } from './providers/MockProvider';
import { GoogleDriveProvider } from './providers/GoogleDriveProvider';

export class StorageManager {
  private static instance: StorageManager;
  private providers: Map<StorageProviderName, IStorageProvider> = new Map();
  private activeProvider: IStorageProvider | null = null;

  private constructor() {
    this.initializeProviders();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private initializeProviders(): void {
    // Check if we should use mock providers
    const useMock = import.meta.env.VITE_USE_MOCK_PROVIDER === 'true';
    
    if (useMock || import.meta.env.DEV) {
      console.log('[StorageManager] Initializing with mock providers');
      
      // Initialize mock providers
      this.providers.set('google_drive', new MockProvider('google_drive'));
      this.providers.set('dropbox', new MockProvider('dropbox'));
      this.providers.set('onedrive', new MockProvider('onedrive'));
      this.providers.set('supabase', new MockProvider('supabase'));
      
      // Set Google Drive as default active provider for development
      this.activeProvider = this.providers.get('google_drive') || null;
    } else {
      console.log('[StorageManager] Initializing with real providers');
      
      // Initialize real providers
      this.providers.set('google_drive', new GoogleDriveProvider());
      // TODO: Add other providers when implemented
      // this.providers.set('dropbox', new DropboxProvider());
      // this.providers.set('onedrive', new OneDriveProvider());
      
      // Set Google Drive as default active provider
      this.activeProvider = this.providers.get('google_drive') || null;
    }
  }

  public getProvider(name: StorageProviderName): IStorageProvider | null {
    return this.providers.get(name) || null;
  }

  public getActiveProvider(): IStorageProvider | null {
    return this.activeProvider;
  }

  public async setActiveProvider(name: StorageProviderName): Promise<void> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }

    // Ensure provider is connected
    if (!provider.isConnected()) {
      await provider.connect();
    }

    this.activeProvider = provider;
    console.log(`[StorageManager] Active provider set to: ${name}`);
  }

  public async connectProvider(name: StorageProviderName): Promise<void> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }

    await provider.connect();
    console.log(`[StorageManager] Provider ${name} connected`);
  }

  public async disconnectProvider(name: StorageProviderName): Promise<void> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }

    await provider.disconnect();
    
    // If this was the active provider, clear it
    if (this.activeProvider === provider) {
      this.activeProvider = null;
    }
    
    console.log(`[StorageManager] Provider ${name} disconnected`);
  }

  public async uploadFile(file: File, path?: string): Promise<FileReference> {
    if (!this.activeProvider) {
      throw new Error('No active storage provider');
    }

    if (!this.activeProvider.isConnected()) {
      throw new Error('Active provider is not connected');
    }

    return await this.activeProvider.uploadFile(file, path);
  }

  public async deleteFile(fileId: string): Promise<void> {
    if (!this.activeProvider) {
      throw new Error('No active storage provider');
    }

    return await this.activeProvider.deleteFile(fileId);
  }

  public async getStreamUrl(fileId: string): Promise<string> {
    if (!this.activeProvider) {
      throw new Error('No active storage provider');
    }

    return await this.activeProvider.getStreamUrl(fileId);
  }

  public async getQuota(providerName?: StorageProviderName): Promise<StorageQuota> {
    let provider: IStorageProvider | null;
    
    if (providerName) {
      provider = this.providers.get(providerName);
    } else {
      provider = this.activeProvider;
    }

    if (!provider) {
      throw new Error(providerName ? `Provider ${providerName} not found` : 'No active storage provider');
    }

    return await provider.getQuota();
  }

  public async testConnection(name?: StorageProviderName): Promise<boolean> {
    let provider: IStorageProvider | null;
    
    if (name) {
      provider = this.providers.get(name);
    } else {
      provider = this.activeProvider;
    }

    if (!provider) {
      return false;
    }

    return await provider.testConnection();
  }

  public getAllProviders(): { name: StorageProviderName; provider: IStorageProvider }[] {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      provider
    }));
  }

  public getProviderStatus(name: StorageProviderName): {
    name: StorageProviderName;
    connected: boolean;
    isActive: boolean;
  } {
    const provider = this.providers.get(name);
    return {
      name,
      connected: provider ? provider.isConnected() : false,
      isActive: this.activeProvider === provider
    };
  }

  public async getAllProviderStatuses(): Promise<{
    name: StorageProviderName;
    connected: boolean;
    isActive: boolean;
    quota?: StorageQuota;
  }[]> {
    const statuses = [];
    
    for (const [name, provider] of this.providers.entries()) {
      const status = {
        name,
        connected: provider.isConnected(),
        isActive: this.activeProvider === provider,
        quota: undefined as StorageQuota | undefined
      };

      // Get quota if connected
      if (status.connected) {
        try {
          status.quota = await provider.getQuota();
        } catch (error) {
          console.warn(`[StorageManager] Failed to get quota for ${name}:`, error);
        }
      }

      statuses.push(status);
    }

    return statuses;
  }

  // Development/testing helpers
  public reset(): void {
    console.log('[StorageManager] Resetting all providers');
    this.providers.clear();
    this.activeProvider = null;
    this.initializeProviders();
  }

  public isMockMode(): boolean {
    return import.meta.env.VITE_USE_MOCK_PROVIDER === 'true' || import.meta.env.DEV;
  }
}