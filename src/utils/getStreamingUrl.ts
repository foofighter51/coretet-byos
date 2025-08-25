import { supabase } from '../lib/supabase';

/**
 * Get the proper streaming URL for a track (Supabase storage only)
 */
export async function getStreamingUrl(track: { 
  id: string; 
  url: string; 
  s3_key?: string;
}): Promise<string> {
  // For Supabase storage, try to get secure URL if needed
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