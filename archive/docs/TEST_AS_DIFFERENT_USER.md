# Testing Playlist Sharing Between Users

Since you only have one Supabase account, here's how to test with different users:

## Option 1: Test in the App (Recommended)
1. Log out of the current user in your app
2. Log in as the recipient user (the email you shared with)
3. Check if they see the playlist under "Shared With Me"

## Option 2: Create Test User in App
1. Sign up a new test account in your app with a different email
2. Share a playlist with that test email from your main account
3. Log out and log in as the test user
4. The shared playlist should appear

## Option 3: Use Supabase Auth Admin (If Enabled)
In Supabase Dashboard:
1. Go to Authentication → Users
2. You can create test users here
3. Use "Send Magic Link" to get login access

## Quick Verification Without Switching Users
Run this SQL to see ALL shares in the system:

```sql
-- ADMIN VIEW: See all shares (not user-specific)
SELECT 
    ps.id,
    ps.shared_by,
    ps.shared_with_email,
    ps.status,
    p.name as playlist_name,
    pr1.email as owner_email,
    ps.accepted_at,
    CASE 
        WHEN ps.status = 'active' THEN '✅ Should be visible to recipient'
        WHEN ps.status = 'pending' THEN '⏳ Waiting for login'
        ELSE ps.status
    END as visibility_status
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr1 ON pr1.id = ps.shared_by
ORDER BY ps.created_at DESC;
```

## Testing Checklist
- [ ] Share created successfully (status = 'active')
- [ ] Recipient email matches exactly (case-insensitive)
- [ ] Playlist has tracks
- [ ] Edge function is deployed for track URLs
- [ ] No RLS policy errors in console

The key is that the sharing system works based on email matching, so the recipient needs to log in with the exact email address you shared with.