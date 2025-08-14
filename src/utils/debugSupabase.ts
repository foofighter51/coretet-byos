import { supabase } from '../lib/supabase';

export async function debugPlaylistAccess() {
  try {
    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return;
    }

    // Test direct query to playlists
    await supabase
      .from('playlists')
      .select('*');

    // Test playlist_tracks access
    await supabase
      .from('playlist_tracks')
      .select('*')
      .limit(5);
    
  } catch (_error) {
    // Debug error silently handled
  }
}

// Call this function from browser console: debugPlaylistAccess()