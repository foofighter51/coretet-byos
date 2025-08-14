import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  playlistId: string
  playlistName: string
  sharedByEmail: string
  sharedWithEmail: string
  shareId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const _supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    // Get the request body
    const { _playlistId, playlistName, sharedByEmail, sharedWithEmail, _shareId }: InviteRequest = await req.json()

    // Send email using Resend API
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'CoreTet <feedback@coretet.app>',
        to: [sharedWithEmail],
        subject: `You've been invited to collaborate on "${playlistName}"`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFD700;">You're invited to collaborate!</h2>
            <p>${sharedByEmail} has invited you to collaborate on their playlist "<strong>${playlistName}</strong>" on CoreTet.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>You'll be able to:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Listen to all tracks in the playlist</li>
                <li>Rate tracks (listened/liked/loved)</li>
                <li>See how others have rated the tracks</li>
              </ul>
            </div>
            
            <p>To accept this invitation, simply log in to CoreTet with this email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('PUBLIC_SITE_URL') || 'https://coretet.app'}" 
                 style="display: inline-block; background: #FFD700; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Log in to CoreTet
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you don't have an account yet, you'll need to sign up first using this email address.
            </p>
          </div>
        `,
        text: `You're invited to collaborate!

${sharedByEmail} has invited you to collaborate on their playlist "${playlistName}" on CoreTet.

You'll be able to:
- Listen to all tracks in the playlist
- Rate tracks (listened/liked/loved)
- See how others have rated the tracks

To accept this invitation, simply log in to CoreTet with this email address.

Visit: ${Deno.env.get('PUBLIC_SITE_URL') || 'https://coretet.app'}

If you don't have an account yet, you'll need to sign up first using this email address.`
      }),
    })

    if (!emailRes.ok) {
      const errorText = await emailRes.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Failed to send email: ${errorText}`)
    }

    const emailData = await emailRes.json()
    console.log('Email sent successfully:', emailData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        emailId: emailData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-playlist-invite:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})