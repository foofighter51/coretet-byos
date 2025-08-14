// CoreTet BYOS Storage Types

export type StorageProviderName = 'google_drive' | 'dropbox' | 'onedrive' | 'supabase';

export interface StorageProvider {
  name: StorageProviderName;
  displayName: string;
  connected: boolean;
  isActive?: boolean;
  quota?: {
    used: number;
    total: number;
    unit: 'bytes' | 'gb';
  };
  lastSync?: string;
  email?: string;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  errorMessage?: string;
}

export interface FileReference {
  id: string;
  provider: StorageProviderName;
  providerId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url?: string;
  streamUrl?: string;
  uploadedAt: string;
  path?: string;
}

export interface ProviderConfig {
  name: StorageProviderName;
  displayName: string;
  icon: string;
  color: string;
  description: string;
  features: string[];
  maxFileSize: number;
  supportedFormats: string[];
}

export interface StorageQuota {
  used: number;
  total: number;
  percentage: number;
  warning: boolean;
  critical: boolean;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  provider: StorageProviderName;
  error?: string;
  fileReference?: FileReference;
}

export interface IStorageProvider {
  name: StorageProviderName;
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  uploadFile(file: File, path?: string): Promise<FileReference>;
  deleteFile(fileId: string): Promise<void>;
  getStreamUrl(fileId: string): Promise<string>;
  getQuota(): Promise<StorageQuota>;
  listFiles(path?: string): Promise<FileReference[]>;
  testConnection(): Promise<boolean>;
}

export interface StorageContextType {
  providers: StorageProvider[];
  activeProvider: StorageProvider | null;
  isLoading: boolean;
  connectProvider: (name: StorageProviderName) => Promise<void>;
  disconnectProvider: (name: StorageProviderName) => Promise<void>;
  switchProvider: (name: StorageProviderName) => Promise<void>;
  uploadFile: (file: File, path?: string) => Promise<FileReference>;
  refreshProviders: () => Promise<void>;
  getProviderQuota: (name: StorageProviderName) => Promise<StorageQuota | null>;
}

// Database types for user storage providers
export interface UserStorageProvider {
  id: string;
  user_id: string;
  provider: StorageProviderName;
  encrypted_access_token?: string;
  encrypted_refresh_token?: string;
  token_expiry?: string;
  provider_email?: string;
  storage_quota?: number;
  storage_used?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Track updates for BYOS
export interface TrackWithProvider extends Track {
  storage_provider: StorageProviderName;
  provider_file_id?: string;
  provider_url?: string;
}

// Migration types
export interface MigrationTask {
  id: string;
  trackId: string;
  fromProvider: StorageProviderName;
  toProvider: StorageProviderName;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MigrationStatus {
  totalTracks: number;
  completedTracks: number;
  failedTracks: number;
  inProgressTracks: number;
  estimatedTimeRemaining?: number;
  currentTask?: MigrationTask;
}