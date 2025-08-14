import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UploadRequest {
  fileName: string;
  fileSize: number;
  category: 'songs' | 'demos' | 'ideas' | 'voice-memos' | 'final-versions' | 'live-performances';
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from request authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { fileName, fileSize, category }: UploadRequest = await req.json();

    // Validate file type
    const allowedExtensions = ['.mp3', '.m4a', '.wav', '.flac'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: 'Only MP3, M4A, WAV, and FLAC files are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check file size (max 100MB)
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (fileSize > maxFileSize) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 100MB limit' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user storage limit
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('storage_used, storage_limit')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check storage limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile && (profile.storage_used + fileSize) > profile.storage_limit) {
      return new Response(
        JSON.stringify({ error: 'Storage limit exceeded' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique track ID and storage path
    const trackId = crypto.randomUUID();
    const storagePath = `${user.id}/${trackId}/${fileName}`;

    // Generate signed upload URL for Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('audio-files')
      .createSignedUploadUrl(storagePath);

    if (uploadError || !uploadData) {
      return new Response(
        JSON.stringify({ error: 'Failed to create upload URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create track record in database
    const { data: track, error: trackError } = await supabaseClient
      .from('tracks')
      .insert({
        id: trackId,
        user_id: user.id,
        name: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        file_name: fileName,
        file_size: fileSize,
        storage_path: storagePath,
        category: category || 'songs',
      })
      .select()
      .single();

    if (trackError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create track record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return upload URL and track info
    return new Response(
      JSON.stringify({
        track,
        uploadUrl: uploadData.signedUrl,
        path: uploadData.path,
        token: uploadData.token,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Upload track error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});