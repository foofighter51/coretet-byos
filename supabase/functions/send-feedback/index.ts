import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FeedbackRequest {
  topic: string
  comment: string
  userEmail: string
  userId: string
  attachments?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get request body
    const { topic, comment, userEmail, userId, attachments = [] }: FeedbackRequest = await req.json()

    if (!topic || !comment) {
      return new Response(
        JSON.stringify({ error: 'Topic and comment are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Store feedback in database
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        topic,
        comment,
        attachments: attachments.length > 0 ? attachments : null,
      })

    if (insertError) {
      console.error('Error storing feedback:', insertError)
      // Continue even if database insert fails
    }

    // Send email using Resend API if available
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'CoreTet <feedback@coretet.app>',
          to: ['coretetapp@gmail.com'],
          subject: `Beta Feedback: ${topic}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Beta User Feedback</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                <p><strong>From:</strong> ${userEmail}</p>
                <p><strong>User ID:</strong> ${userId}</p>
                <p><strong>Date/Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Topic:</strong> ${topic}</p>
              </div>
              <div style="margin-top: 20px; padding: 20px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Comment:</h3>
                <p style="white-space: pre-wrap;">${comment}</p>
              </div>
              ${attachments.length > 0 ? `
                <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
                  <h3 style="color: #333; margin-top: 0;">Attachments (${attachments.length}):</h3>
                  <ul style="list-style-type: none; padding-left: 0;">
                    ${attachments.map(url => `<li style="margin-bottom: 8px;"><a href="${url}" style="color: #0066cc; text-decoration: none;">View attachment</a></li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `,
          text: `Beta User Feedback\n\nFrom: ${userEmail}\nUser ID: ${userId}\nDate/Time: ${new Date().toLocaleString()}\nTopic: ${topic}\n\nComment:\n${comment}${attachments.length > 0 ? `\n\nAttachments (${attachments.length}):\n${attachments.join('\n')}` : ''}`
        }),
      })

      if (!emailRes.ok) {
        const errorText = await emailRes.text()
        console.error('Resend API error:', errorText)
        
        // If Resend fails but we saved to DB, still return success
        if (!insertError) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Feedback saved but email could not be sent' 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
        
        throw new Error('Failed to send email and save feedback')
      }
    } else {
      // No email service configured, but feedback was saved
      if (!insertError) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Feedback saved successfully' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Feedback sent successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})