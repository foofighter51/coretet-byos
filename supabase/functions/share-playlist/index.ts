import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShareRequest {
  playlistId: string
  emails: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the JWT and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { playlistId, emails }: ShareRequest = await req.json()

    if (!playlistId || !emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Playlist ID and emails are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user owns the playlist
    const { data: playlist } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .eq('user_id', user.id)
      .single()

    if (!playlist) {
      return new Response(
        JSON.stringify({ error: 'Playlist not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile for sender name
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const results = []
    const errors = []

    for (const email of emails) {
      try {
        // Check if already shared
        const { data: existing } = await supabase
          .from('playlist_shares')
          .select('*')
          .eq('playlist_id', playlistId)
          .eq('shared_with_email', email.toLowerCase().trim())
          .single()

        if (existing) {
          if (existing.status === 'revoked') {
            // Reactivate revoked share
            await supabase
              .from('playlist_shares')
              .update({ 
                status: 'pending',
                share_token: crypto.randomUUID(),
                invited_at: new Date().toISOString()
              })
              .eq('id', existing.id)
            
            results.push({ email, status: 'reinvited' })
          } else {
            errors.push({ email, error: 'Already shared' })
            continue
          }
        } else {
          // Create new share
          const shareToken = crypto.randomUUID()
          
          const { error: insertError } = await supabase
            .from('playlist_shares')
            .insert({
              playlist_id: playlistId,
              shared_by: user.id,
              shared_with_email: email.toLowerCase().trim(),
              status: 'pending',
              share_token: shareToken,
            })

          if (insertError) {
            errors.push({ email, error: 'Failed to create share' })
            continue
          }

          // Send email using Resend if configured
          const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
          if (RESEND_API_KEY) {
            const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
            const inviteUrl = `${appUrl}/collaborate/invite?token=${shareToken}`

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: 'CoreTet <noreply@coretet.com>',
                to: [email],
                subject: `${profile?.email || 'Someone'} shared "${playlist.name}" with you`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">You're invited to collaborate!</h2>
                    <p>${profile?.email || 'A CoreTet user'} has shared the playlist "<strong>${playlist.name}</strong>" with you.</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p>With this playlist, you can:</p>
                      <ul>
                        <li>Listen to all tracks</li>
                        <li>Rate tracks (listened/liked/loved)</li>
                        <li>See ratings from other collaborators</li>
                      </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${inviteUrl}" style="background: #facc15; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Accept Invitation
                      </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                      If you're new to CoreTet, you'll need to create a quick account (just email and password).
                      If you already have a collaborator account, just log in.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                      This invitation was sent from CoreTet. If you didn't expect this, you can safely ignore it.
                    </p>
                  </div>
                `,
              }),
            })
          }

          results.push({ email, status: 'invited' })
        }
      } catch (error) {
        errors.push({ email, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        errors,
        message: `Invited ${results.length} collaborator(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Share error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})