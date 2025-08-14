import { supabase } from '../lib/supabase';

export async function debugPlaylistShare() {
  try {
    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return;
    }
    
    // Check if share-playlist function exists
    await supabase.functions.invoke('share-playlist', {
      body: { test: true }
    });
    
    // Check recent playlist shares
    await supabase
      .from('playlist_shares')
      .select('*')
      .eq('shared_by', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
  } catch (_error) {
    // Debug error silently handled
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as unknown).debugPlaylistShare = debugPlaylistShare;
}