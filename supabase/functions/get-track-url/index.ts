import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { trackId } = await req.json();

    // Verify user has access to this track (owns it or has shared access)
    const { data: track, error: trackError } = await supabaseClient
      .from('tracks')
      .select('storage_path, user_id')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      return new Response('Track not found', { status: 404, headers: corsHeaders });
    }

    // Check if user owns the track
    if (track.user_id === user.id) {
      // User owns the track, proceed
    } else {
      // Check if user has access through a shared playlist
      const { data: sharedAccess } = await supabaseClient
        .from('playlist_tracks')
        .select(`
          playlist_id,
          playlists!inner(id),
          playlist_shares!inner(
            shared_with_email,
            share_status
          )
        `)
        .eq('track_id', trackId)
        .eq('playlist_shares.share_status', 'accepted')
        .ilike('playlist_shares.shared_with_email', user.email || '');

      if (!sharedAccess || sharedAccess.length === 0) {
        return new Response('Access denied', { status: 403, headers: corsHeaders });
      }
    }

    // Generate signed URL with service role (always works)
    const { data: urlData, error: urlError } = await supabaseClient.storage
      .from('audio-files')
      .createSignedUrl(track.storage_path, 3600); // 1 hour expiry

    if (urlError || !urlData) {
      console.error('URL generation error:', urlError);
      return new Response('Failed to generate URL', { status: 500, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ url: urlData.signedUrl }),
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