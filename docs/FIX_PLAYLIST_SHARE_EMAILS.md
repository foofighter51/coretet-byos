# Fix Playlist Share Emails Not Being Sent

The playlist sharing creates database entries but doesn't send emails because the Resend API key is not configured in Supabase Edge Functions.

## Quick Debug

1. Open your app and run in browser console:
```javascript
window.debugPlaylistShare()
```

This will show you recent shares and function status.

## Fix Steps

### 1. Set up Resend API Key

First, make sure you have a Resend account and API key:
1. Go to [Resend.com](https://resend.com) and sign in
2. Get your API key from the dashboard
3. Verify your domain (coretet.com) or use Resend's test domain

### 2. Add API Key to Supabase

Run this command in your terminal (replace with your actual API key):
```bash
supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY_HERE --project-ref chynnmeidbcqsnswlxmt
```

### 3. Verify the "From" Email

The share-playlist function uses `noreply@coretet.com` as the sender. You need to either:
- Verify this domain in Resend, OR
- Change it to use Resend's test email

To use Resend's test email temporarily, modify the Edge Function:
```typescript
// Change from:
from: 'CoreTet <noreply@coretet.com>',
// To:
from: 'CoreTet <onboarding@resend.dev>',
```

### 4. Check Edge Function Logs

1. Go to your Supabase dashboard
2. Navigate to Functions → share-playlist
3. Check the logs for any errors

## Alternative: Manual Sharing

If you need to share playlists immediately without setting up email:

1. Share the playlist (it creates the database entry)
2. Go to Supabase dashboard → Table Editor → playlist_shares
3. Find the share_token for the invite
4. Send this link to your collaborator:
   ```
   https://coretet.app/collaborate/invite?token=SHARE_TOKEN_HERE
   ```

## Testing

After setting up Resend:
1. Try sharing a playlist again
2. Check the Edge Function logs
3. The collaborator should receive an email with an "Accept Invitation" button

## Common Issues

- **"Domain not verified"**: You need to verify coretet.com in Resend
- **"Invalid API key"**: Double-check the API key in Supabase secrets
- **No logs**: Make sure the Edge Function is deployed and running