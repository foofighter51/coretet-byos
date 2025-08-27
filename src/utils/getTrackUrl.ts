import { getStreamingUrl } from './getStreamingUrl';
import { supabase } from '../lib/supabase';

export async function getTrackUrl(trackId: string): Promise<string | null> {
  try {
    // Get track from database
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, storage_path, provider_url, url')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      console.error('Error getting track:', trackError);
      return null;
    }

    // Use the main getStreamingUrl function for consistency
    return await getStreamingUrl(track);
  } catch (error) {
    console.error('Error getting track URL:', error);
    return null;
  }
}