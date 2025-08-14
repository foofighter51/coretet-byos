import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InviteRequest {
  email?: string;
  expiresInDays?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
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

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      return new Response('Forbidden: Admin access required', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const { email, expiresInDays = 7 }: InviteRequest = await req.json();

    // Generate unique invite code
    const generateInviteCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let inviteCode = generateInviteCode();
    
    // Ensure code is unique
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseClient
        .from('invites')
        .select('id')
        .eq('code', inviteCode)
        .single();
      
      if (!existing) break;
      
      inviteCode = generateInviteCode();
      attempts++;
    }

    if (attempts >= 10) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique invite code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseClient
      .from('invites')
      .insert({
        code: inviteCode,
        email: email || null,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Failed to create invite:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        invite,
        inviteUrl: `${req.headers.get('origin') || 'https://your-app.netlify.app'}?invite=${inviteCode}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Generate invite error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});