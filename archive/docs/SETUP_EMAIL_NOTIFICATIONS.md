# Setting Up Email Notifications for Playlist Invites

Currently, playlist invitations are stored in the database but email notifications are not being sent. Here's how to enable email notifications:

## Option 1: Using Supabase Auth Email (Simplest)

Supabase provides built-in email functionality through their Auth service, but it's limited to auth-related emails. For custom emails like playlist invites, you'll need one of the following options.

## Option 2: Using Resend (Recommended)

1. Sign up for a [Resend](https://resend.com) account
2. Get your API key from the Resend dashboard
3. Add the API key to your Supabase project:
   ```bash
   supabase secrets set RESEND_API_KEY=your_api_key_here
   ```
4. Update the edge function `/supabase/functions/send-playlist-invite/index.ts` to use Resend:
   ```typescript
   import { Resend } from 'https://esm.sh/resend@2.0.0'
   
   const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
   await resend.emails.send({
     from: 'CoreTet <noreply@yourdomain.com>',
     to: sharedWithEmail,
     subject: emailContent.subject,
     html: emailContent.html,
     text: emailContent.text
   })
   ```

## Option 3: Using SendGrid

1. Sign up for a [SendGrid](https://sendgrid.com) account
2. Create an API key with "Mail Send" permissions
3. Add the API key to your Supabase project:
   ```bash
   supabase secrets set SENDGRID_API_KEY=your_api_key_here
   ```
4. Update the edge function to use SendGrid

## Option 4: Using Supabase Email Hooks (Advanced)

You can configure database webhooks to trigger when a new row is inserted into `playlist_shares` table.

## Deploying the Edge Function

Once you've configured an email service:

1. Deploy the edge function:
   ```bash
   supabase functions deploy send-playlist-invite
   ```

2. Update the SharePlaylistModal to call the edge function after creating shares:
   ```typescript
   // After successful share creation
   await supabase.functions.invoke('send-playlist-invite', {
     body: {
       playlistId,
       playlistName,
       sharedByEmail: user.email,
       sharedWithEmail: email
     }
   })
   ```

## Current Status

The edge function is created but not deployed. It currently only logs what emails would be sent. To enable actual email sending:

1. Choose an email service provider
2. Add their API key to Supabase secrets
3. Update the edge function with the provider's SDK
4. Deploy the function
5. Update the frontend to call the function

## Testing Without Email Service

For testing, the current implementation stores all invitations in the database. Users can still accept invitations by logging in with the invited email address - the system will automatically detect and activate any pending shares for that email.