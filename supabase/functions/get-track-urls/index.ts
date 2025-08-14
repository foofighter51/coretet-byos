import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackUrlRequest {
  trackIds: string[];
}

interface TrackUrlResponse {
  urls: Record<string, string>;
  errors: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { trackIds }: TrackUrlRequest = await req.json();

    // Get tracks that user has access to (owned or through shared playlists)
    const { data: tracks, error: trackError } = await supabaseClient
      .from('tracks')
      .select('id, storage_path, user_id')
      .in('id', trackIds);

    if (trackError) {
      console.error('Track query error:', trackError);
      return new Response('Failed to query tracks', { status: 500, headers: corsHeaders });
    }

    // Get user's email for checking shared playlists
    const userEmail = user.email?.toLowerCase();
    
    // Get list of playlist IDs that are shared with this user
    const { data: sharedPlaylists } = await supabaseClient
      .from('playlist_shares')
      .select('playlist_id')
      .eq('shared_with_email', userEmail)
      .eq('status', 'active');
    
    const sharedPlaylistIds = sharedPlaylists?.map(sp => sp.playlist_id) || [];
    
    // Get track IDs from shared playlists
    const { data: sharedTrackIds } = await supabaseClient
      .from('playlist_tracks')
      .select('track_id')
      .in('playlist_id', sharedPlaylistIds);
    
    const sharedTrackIdSet = new Set(sharedTrackIds?.map(st => st.track_id) || []);

    const response: TrackUrlResponse = {
      urls: {},
      errors: {}
    };

    // Generate signed URLs for each track user has access to
    for (const track of tracks || []) {
      // Check if user owns the track or has access through a shared playlist
      const hasAccess = track.user_id === user.id || sharedTrackIdSet.has(track.id);
      
      if (!hasAccess) {
        response.errors[track.id] = 'Access denied';
        continue;
      }
      try {
        const { data: urlData, error: urlError } = await supabaseClient.storage
          .from('audio-files')
          .createSignedUrl(track.storage_path, 3600); // 1 hour expiry

        if (urlError || !urlData) {
          response.errors[track.id] = 'Failed to generate URL';
        } else {
          response.urls[track.id] = urlData.signedUrl;
        }
      } catch (_error) {
        response.errors[track.id] = 'URL generation error';
      }
    }

    // Add errors for tracks not found
    for (const trackId of trackIds) {
      if (!response.urls[trackId] && !response.errors[trackId]) {
        response.errors[trackId] = 'Track not found';
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});