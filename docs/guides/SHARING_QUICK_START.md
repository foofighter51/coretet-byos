# Playlist Sharing Quick Start Guide

## 🚀 Getting Started

### 1. Run the Setup SQL
In Supabase SQL Editor, run:
```sql
-- This creates the sharing tables and policies
CREATE_SHARING_SYSTEM.sql
```

### 2. Test the Setup
Run this to verify everything is working:
```sql
TEST_SHARING.sql
```

## 📤 How to Share a Playlist

### Desktop/Web:
1. Hover over any playlist in the sidebar
2. Click the share icon (↗️) that appears
3. Enter the recipient's email address
4. Click "Send Invite"

### What Happens Next:
- Share is created in the database
- When recipient logs in with that email, the playlist automatically appears
- No email is sent yet (future feature)

## 📥 Receiving Shared Playlists

### Desktop/Web:
- Shared playlists appear in your regular playlist list
- Look for playlists you didn't create

### Mobile:
- Go to "Shared Lists" section
- See all playlists shared with you
- Tap to play

## 🧪 Testing Between Accounts

### Quick Test:
1. **Account A**: Share a playlist with Account B's email
2. **Account B**: Log out and back in
3. **Account B**: Check playlists - shared one should appear

### Using SQL:
```sql
-- As Account A: Share a playlist
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email,
    can_rate
) VALUES (
    'your-playlist-id-here',
    auth.uid(),
    'accountb@example.com',
    true
);

-- As Account B: Check shared playlists
SELECT * FROM my_shared_playlists;
```

## ⭐ Rating in Shared Playlists

- Ratings in shared playlists are separate from personal ratings
- Everyone can see aggregated ratings
- Your personal library ratings remain private

## 🔒 Security

- Only logged-in users can access shared playlists
- Recipients must have an account
- File access is secured through edge functions
- No public/anonymous access

## 🐛 Troubleshooting

### Playlist not appearing?
1. Make sure recipient is logged in with exact email used in share
2. Check share status: `SELECT * FROM playlist_shares WHERE shared_with_email = 'email@example.com';`
3. Try logging out and back in

### Can't play tracks?
1. Edge function handles shared track access
2. Check browser console for errors
3. Verify tracks have valid storage_path

### Share button not visible?
1. Hover over playlist name in sidebar
2. Make sure you're using latest code
3. Hard refresh the page (Ctrl+Shift+R)

## 📱 Mobile Testing

1. Share playlist from desktop
2. Open mobile app/PWA
3. Navigate to "Shared Lists"
4. Tap playlist to play
5. Use rating buttons to rate tracks

## 🎉 Success Indicators

- ✅ Share button appears on hover
- ✅ Modal opens and accepts email
- ✅ No errors in console
- ✅ Recipient sees playlist after login
- ✅ Tracks play in shared playlists
- ✅ Ratings work in playlist context

## 🚧 Future Enhancements

- [ ] Email notifications
- [ ] Share management UI
- [ ] Revoke access feature
- [ ] Share analytics
- [ ] Public link sharing (optional)