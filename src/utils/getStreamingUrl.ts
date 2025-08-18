import { GoogleDriveProvider } from '../services/storage/providers/GoogleDriveProvider';
import { supabase } from '../lib/supabase';

/**
 * Get the proper streaming URL for a track based on its storage provider
 */
export async function getStreamingUrl(track: { 
  id: string; 
  url: string; 
  storage_provider?: string; 
  provider_file_id?: string; 
  s3_key?: string;
}): Promise<string> {
  // For Google Drive tracks, generate authenticated streaming URL
  if (track.storage_provider === 'google_drive' && track.provider_file_id) {
    try {
      const googleProvider = new GoogleDriveProvider();
      const isConnected = await googleProvider.isConnected();
      
      if (isConnected) {
        return await googleProvider.getStreamUrl(track.provider_file_id);
      } else {
        console.warn('Google Drive not connected, falling back to static URL');
        return track.url;
      }
    } catch (error) {
      console.error('Failed to get Google Drive streaming URL:', error);
      return track.url;
    }
  }
  
  // For Supabase storage, try to get secure URL if needed
  if (track.storage_provider === 'supabase' || !track.storage_provider) {
    if (!track.url || track.url.includes('/public/')) {
      try {
        const { data, error } = await supabase.functions.invoke('get-track-url', {
          body: { trackId: track.id }
        });
        
        if (error) {
          console.error('Error getting secure URL:', error);
          return track.url;
        }
        
        if (data?.url) {
          return data.url;
        }
      } catch (error) {
        console.error('Failed to get secure URL:', error);
      }
    }
    
    return track.url;
  }
  
  // For other providers, return the URL as-is
  return track.url;
}