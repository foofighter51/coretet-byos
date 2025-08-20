import React, { useState } from 'react';
import { ProviderCard } from '../components/Storage/ProviderCard';
import { GoogleDriveBrowser } from '../components/Storage/GoogleDriveBrowser';
import { STORAGE_PROVIDERS } from '../config/storageProviders';
import { useStorage } from '../contexts/StorageContext';
import { supabase } from '../lib/supabase';
import { GoogleDriveProvider } from '../services/storage/providers/GoogleDriveProvider';
import '../styles/byos-components.css';

// Helper function to import Google Drive folders
async function importGoogleDriveFolders(folders: any[]) {
  console.log('Starting import process for folders:', folders);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const googleProvider = new GoogleDriveProvider();
  const isConnected = await googleProvider.isConnected();
  if (!isConnected) {
    throw new Error('Google Drive not connected');
  }

  let totalImported = 0;
  const errors: string[] = [];

  for (const folder of folders) {
    try {
      console.log(`Processing folder: ${folder.name} (${folder.id})`);
      
      // Get all audio files in this folder
      const audioFiles = await googleProvider.discoverAudioFiles(folder.id);
      console.log(`Found ${audioFiles.length} audio files in ${folder.name}`);
      
      // Create track records for each audio file
      for (const file of audioFiles) {
        try {
          const trackData = {
            user_id: user.id,
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            file_name: file.name,
            file_size: parseInt(file.size) || 0,
            s3_key: null, // No S3 key for BYOS files
            duration: null, // We'll implement metadata extraction later
            category: 'songs' as const,
            tags: [] as string[],
            storage_provider: 'google_drive',
            provider_file_id: file.id,
            provider_url: file.webContentLink,
            artist: null,
            collection: folder.name, // Use folder name as collection
            genre: null,
            listened: false,
            liked: false,
            loved: false
          };

          const { data, error } = await supabase
            .from('tracks')
            .insert(trackData)
            .select();

          if (error) {
            console.error('Error inserting track:', file.name, error);
            errors.push(`${file.name}: ${error.message}`);
          } else {
            console.log('Successfully imported:', file.name);
            totalImported++;
          }
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError);
          errors.push(`${file.name}: ${fileError.message}`);
        }
      }
    } catch (folderError) {
      console.error('Error processing folder:', folder.name, folderError);
      errors.push(`${folder.name}: ${folderError.message}`);
    }
  }

  console.log(`Import completed: ${totalImported} tracks imported`);
  if (errors.length > 0) {
    console.error('Import errors:', errors);
    throw new Error(`Imported ${totalImported} tracks with ${errors.length} errors. Check console for details.`);
  }

  return { imported: totalImported, errors };
}

export function StorageSettings() {
  const { 
    providers, 
    activeProvider, 
    isLoading, 
    connectProvider, 
    disconnectProvider, 
    switchProvider 
  } = useStorage();

  const [showGoogleBrowser, setShowGoogleBrowser] = useState(false);

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

  const handleGoogleBrowse = () => {
    setShowGoogleBrowser(true);
  };

  const handleFoldersSelected = async (folders: any[]) => {
    console.log('Selected folders for import:', folders);
    setShowGoogleBrowser(false);
    
    // Import the selected folders
    try {
      await importGoogleDriveFolders(folders);
      alert(`Successfully imported ${folders.length} folder${folders.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-forest-dark text-white">
      {/* Header */}
      <div className="border-b border-forest-light bg-forest-main/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-anton text-white mb-2">
                Storage Settings
              </h1>
              <p className="text-silver/70 font-quicksand">
                Connect your cloud storage providers to store and stream your music files
              </p>
            </div>
            
            {/* Overview Stats */}
            <div className="text-right">
              <div className="text-2xl font-anton text-accent-yellow">
                {connectedProviders.length}
              </div>
              <div className="text-sm text-silver/70">
                Connected Providers
              </div>
              <div className="text-sm text-silver/50 mt-1">
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
          <div className="mb-8 p-6 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-accent-yellow rounded-full"></div>
              <div>
                <span className="text-accent-yellow font-medium">Active Storage Provider: </span>
                <span className="text-white">{STORAGE_PROVIDERS[activeProvider.name].displayName}</span>
              </div>
            </div>
            <p className="text-silver/70 text-sm mt-2">
              New uploads will be stored in {STORAGE_PROVIDERS[activeProvider.name].displayName}
            </p>
          </div>
        )}

        {/* No Provider Connected Notice */}
        {!activeProvider && (
          <div className="mb-8 p-6 bg-forest-main/50 border border-forest-light rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-accent-coral rounded-full"></div>
              <div>
                <span className="text-accent-coral font-medium">No Storage Provider Connected</span>
              </div>
            </div>
            <p className="text-silver/70 text-sm mt-2">
              Connect a cloud storage provider to start uploading and streaming your music files.
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

        {/* Google Drive Actions */}
        {providers.find(p => p.name === 'google_drive')?.connected && (
          <div className="mt-8 p-6 bg-forest-main/50 rounded-lg border border-forest-light">
            <h3 className="text-lg font-quicksand font-semibold text-white mb-4">
              Google Drive Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGoogleBrowse}
                className="px-4 py-2 bg-accent-yellow text-gray-900 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
              >
                Browse & Import Existing Files
              </button>
              <button
                disabled
                className="px-4 py-2 bg-forest-light/50 text-silver/50 rounded-lg font-quicksand font-medium cursor-not-allowed"
              >
                Sync Changes (Coming Soon)
              </button>
            </div>
            <p className="text-silver/70 text-sm mt-3">
              Browse your Google Drive folders and import existing music files without re-uploading.
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 p-6 bg-forest-main/50 rounded-lg border border-forest-light">
          <h3 className="text-xl font-quicksand font-semibold text-white mb-4">
            Getting Started with BYOS
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-silver/90 mb-2">1. Connect a Provider</h4>
              <p className="text-silver/70 text-sm">
                Choose Google Drive or Dropbox to store your music files. We recommend starting with Google Drive for the best experience.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-silver/90 mb-2">2. Upload Your Music</h4>
              <p className="text-silver/70 text-sm">
                Once connected, all uploads will be stored in your cloud storage while keeping metadata and playback in CoreTet.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-silver/90 mb-2">3. Stream Anywhere</h4>
              <p className="text-silver/70 text-sm">
                Access your music from any device while maintaining full ownership and control over your files.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-silver/90 mb-2">4. Switch Providers</h4>
              <p className="text-silver/70 text-sm">
                Connect multiple providers and switch between them based on your needs and storage preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mt-8 p-4 bg-accent-coral/20 border border-accent-coral/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-accent-coral rounded-full"></div>
            <span className="text-accent-coral font-medium text-sm">BETA FEATURE</span>
          </div>
          <p className="text-silver/70 text-sm mt-1">
            BYOS is currently in beta. Your existing CoreTet storage remains safe and accessible. 
            Report any issues to help us improve the experience.
          </p>
        </div>
      </div>

      {/* Google Drive Browser Modal */}
      {showGoogleBrowser && (
        <GoogleDriveBrowser
          onFoldersSelected={handleFoldersSelected}
          onClose={() => setShowGoogleBrowser(false)}
        />
      )}
    </div>
  );
}