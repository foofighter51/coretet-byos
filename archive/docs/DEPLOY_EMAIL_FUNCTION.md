# Deploying the Playlist Invite Email Function

The email notification system is now ready to deploy. Since you already have Resend configured (used for the feedback button), the playlist invite emails will use the same configuration.

## Deploy the Edge Function

Run this command to deploy the email function to Supabase:

```bash
supabase functions deploy send-playlist-invite
```

## What This Does

1. **Creates database shares**: When you invite someone, their email is saved in the `playlist_shares` table
2. **Sends email notification**: Using Resend, sends a formatted email to the invited user
3. **Auto-activation**: When the invited user logs in with that email, their shares are automatically activated

## Email Details

- **From**: feedback@coretet.app (same as feedback emails)
- **Subject**: You've been invited to collaborate on "[Playlist Name]"
- **Content**: Explains what they can do and how to accept (just log in)

## Testing

1. Share a playlist with someone
2. Check the success message - it will indicate if emails were sent
3. The recipient should receive an email within a few seconds
4. They can accept by logging in with the invited email address

## Troubleshooting

If emails aren't sending:
1. Check the Supabase function logs: `supabase functions logs send-playlist-invite`
2. Verify RESEND_API_KEY is set: `supabase secrets list`
3. Check that the domain is verified in Resend dashboard

## Email Preview

The email includes:
- Who invited them
- Playlist name
- What they can do (listen, rate tracks, see ratings)
- Clear call-to-action button to log in
- Note about needing to sign up if they don't have an account