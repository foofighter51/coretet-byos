import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthRequest {
  action: 'signup' | 'login' | 'logout' | 'validate'
  email?: string
  password?: string
  name?: string
  token?: string
  shareToken?: string
}

serve(async (req) => {
  // Handle CORS preflight
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

    const { action, email, password, name, token, shareToken }: AuthRequest = await req.json()

    switch (action) {
      case 'signup': {
        if (!email || !password || !name || !shareToken) {
          return new Response(
            JSON.stringify({ error: 'Email, password, name, and share token are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validate share token and get invitation details
        const { data: share } = await supabase
          .from('playlist_shares')
          .select('*')
          .eq('share_token', shareToken)
          .eq('shared_with_email', email)
          .single()

        if (!share) {
          return new Response(
            JSON.stringify({ error: 'Invalid invitation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if collaborator already exists
        const { data: existingCollab } = await supabase
          .from('collaborators')
          .select('id')
          .eq('email', email)
          .single()

        if (existingCollab) {
          return new Response(
            JSON.stringify({ error: 'Account already exists. Please log in.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password)

        // Create collaborator account
        const { data: collaborator, error: createError } = await supabase
          .from('collaborators')
          .insert({
            email,
            name,
            password_hash: passwordHash,
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: 'Failed to create account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update playlist share to active
        await supabase
          .from('playlist_shares')
          .update({
            collaborator_id: collaborator.id,
            status: 'active',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', share.id)

        // Create session
        const sessionToken = nanoid(32)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 day session

        await supabase
          .from('collaborator_sessions')
          .insert({
            collaborator_id: collaborator.id,
            token: sessionToken,
            expires_at: expiresAt.toISOString(),
          })

        return new Response(
          JSON.stringify({
            token: sessionToken,
            collaborator: {
              id: collaborator.id,
              email: collaborator.email,
              name: collaborator.name,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      case 'login': {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get collaborator
        const { data: collaborator } = await supabase
          .from('collaborators')
          .select('*')
          .eq('email', email)
          .single()

        if (!collaborator) {
          return new Response(
            JSON.stringify({ error: 'Invalid email or password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, collaborator.password_hash)
        if (!passwordValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid email or password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update last login
        await supabase
          .from('collaborators')
          .update({ last_login: new Date().toISOString() })
          .eq('id', collaborator.id)

        // Create session
        const sessionToken = nanoid(32)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        await supabase
          .from('collaborator_sessions')
          .insert({
            collaborator_id: collaborator.id,
            token: sessionToken,
            expires_at: expiresAt.toISOString(),
          })

        return new Response(
          JSON.stringify({
            token: sessionToken,
            collaborator: {
              id: collaborator.id,
              email: collaborator.email,
              name: collaborator.name,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      case 'logout': {
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Token required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await supabase
          .from('collaborator_sessions')
          .delete()
          .eq('token', token)

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      case 'validate': {
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Token required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get valid session
        const { data: session } = await supabase
          .from('collaborator_sessions')
          .select('*, collaborator:collaborators(*)')
          .eq('token', token)
          .gte('expires_at', new Date().toISOString())
          .single()

        if (!session) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired session' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            collaborator: {
              id: session.collaborator.id,
              email: session.collaborator.email,
              name: session.collaborator.name,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})