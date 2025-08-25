// CoreTet BYOS Storage Provider Configurations

import { ProviderConfig, StorageProviderName } from '../types/storage';

export const STORAGE_PROVIDERS: Record<StorageProviderName, ProviderConfig> = {
  google_drive: {
    name: 'google_drive',
    displayName: 'Google Drive',
    icon: '🗃️',
    color: '#4285f4',
    description: 'Store your music in Google Drive with 15GB free storage',
    features: [
      'Real-time sync',
      'Automatic backup',
      'Share with collaborators',
      'Version history'
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['mp3', 'm4a', 'wav', 'flac', 'aiff']
  },
  
  dropbox: {
    name: 'dropbox',
    displayName: 'Dropbox',
    icon: '📦',
    color: '#0061ff',
    description: 'Professional storage with advanced sharing controls',
    features: [
      'Professional sharing',
      'Advanced permissions',
      'File recovery',
      'Smart sync'
    ],
    maxFileSize: 150 * 1024 * 1024, // 150MB
    supportedFormats: ['mp3', 'm4a', 'wav', 'flac', 'aiff']
  },
  
  onedrive: {
    name: 'onedrive',
    displayName: 'OneDrive',
    icon: '☁️',
    color: '#0078d4',
    description: 'Integrated with Microsoft 365 suite',
    features: [
      'Office integration',
      'Personal vault',
      'Automatic photos backup',
      'Real-time collaboration'
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['mp3', 'm4a', 'wav', 'flac']
  },
  
  supabase: {
    name: 'supabase',
    displayName: 'CoreTet Storage',
    icon: '🎵',
    color: '#3ecf8e',
    description: 'Built-in storage (legacy support)',
    features: [
      'Instant upload',
      'Optimized for audio',
      'Direct streaming',
      'No setup required'
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['mp3', 'm4a', 'wav', 'flac', 'aiff']
  }
};

export const PROVIDER_COLORS = {
  google_drive: 'bg-blue-500',
  dropbox: 'bg-blue-600', 
  onedrive: 'bg-blue-700',
  supabase: 'bg-green-500'
} as const;

export const PROVIDER_OAUTH_SCOPES = {
  google_drive: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
  ],
  dropbox: [
    'files.content.write',
    'files.content.read'
  ],
  onedrive: [
    'Files.ReadWrite.AppFolder',
    'User.Read'
  ]
} as const;

export const DEFAULT_PROVIDER: StorageProviderName = 'google_drive';

export const FEATURE_FLAGS = {
  GOOGLE_DRIVE: true,
  DROPBOX: false, // Phase 2
  ONEDRIVE: false, // Phase 2  
  MIGRATION_WIZARD: false, // Phase 2
  MULTI_PROVIDER: false, // Phase 3
  AUTO_BACKUP: false, // Phase 3
} as const;

// File organization structure in provider storage
export const STORAGE_PATHS = {
  AUDIO_FILES: 'coretet/audio',
  ALBUM_ART: 'coretet/artwork', 
  EXPORTS: 'coretet/exports',
  BACKUPS: 'coretet/backups'
} as const;