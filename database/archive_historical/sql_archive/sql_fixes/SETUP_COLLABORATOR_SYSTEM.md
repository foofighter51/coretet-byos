# Setting Up the Collaborator System

## 1. Apply Database Migration

Run the collaborator system migration in your Supabase SQL Editor:

```sql
-- Copy the contents of:
supabase/migrations/20250724_collaborator_system.sql
```

## 2. Deploy Edge Functions

Deploy the authentication and sharing functions:

```bash
# Deploy collaborator auth function
supabase functions deploy collaborator-auth

# Deploy share playlist function  
supabase functions deploy share-playlist
```

## 3. Configure Environment

Make sure you have these environment variables set:

### For Edge Functions (Supabase Secrets):
```bash
# Email service (if using Resend)
supabase secrets set RESEND_API_KEY=your_resend_api_key

# App URL for email links
supabase secrets set APP_URL=https://your-app-domain.com
```

### For Local Development:
Add to your `.env.local`:
```
APP_URL=http://localhost:5173
```

## 4. Test the System

### Share a Playlist:
1. Create a playlist in your main account
2. Click the "Share" button when viewing the playlist
3. Enter collaborator email addresses
4. Send invitations

### Collaborator Flow:
1. Collaborator receives email with invite link
2. Clicks link → taken to `/collaborate/invite?token=...`
3. Creates account (name, password)
4. Automatically logged in and playlist access granted
5. Can view shared playlists at `/collaborate`

## 5. Troubleshooting

### "Playlists table not found" error
Run the playlist migration first:
```sql
supabase/migrations/20250723_create_playlists_table_safe.sql
```

### Email not sending
- Check Resend API key is set
- Verify sender domain in Resend dashboard
- Check edge function logs: `supabase functions logs share-playlist`

### Collaborator can't authenticate
- Check edge function logs: `supabase functions logs collaborator-auth`
- Verify the share token hasn't expired
- Ensure RLS policies are correct

## Next Steps

After basic setup works:
1. Implement playlist view for collaborators
2. Add track rating functionality
3. Show aggregate ratings in main user view
4. Add real-time updates for ratings