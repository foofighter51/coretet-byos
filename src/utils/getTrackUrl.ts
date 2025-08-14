import { supabase } from '../lib/supabase';

export async function getTrackUrl(trackId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-track-url', {
      body: { trackId }
    });

    if (error) {
      console.error('Error getting track URL:', error);
      return null;
    }

    return data?.url || null;
  } catch (error) {
    console.error('Error getting track URL:', error);
    return null;
  }
}