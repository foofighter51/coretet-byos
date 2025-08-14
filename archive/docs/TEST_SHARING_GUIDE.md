# CoreTet Playlist Sharing Test Guide

## Prerequisites
- Two user accounts (we'll call them User A and User B)
- User A has at least one playlist with tracks
- Both users can log in successfully

## Test Flow

### Step 1: Verify Initial State (User A)
1. Log in as User A
2. Navigate to your playlists
3. Confirm you see your playlists with tracks

### Step 2: Share a Playlist (User A)
1. Click the three dots menu on a playlist
2. Select "Share Playlist"
3. Enter User B's email address
4. Toggle "Allow ratings" to ON
5. Click "Share"
6. Confirm you see a success message

### Step 3: Switch to User B
1. Log out of User A
2. Log in as User B
3. The auto-accept function should run automatically
4. Navigate to "Shared Playlists" in the sidebar

### Step 4: Verify Shared Access (User B)
1. Confirm you see the shared playlist
2. Click on the playlist to view tracks
3. Try playing a track - it should play successfully
4. Try rating a track (1-5 stars)

### Step 5: Check Ratings (Both Users)
1. As User B: Verify your rating appears
2. Switch back to User A
3. Navigate to the shared playlist
4. Confirm you can see User B's ratings

## What Should Work
- ✅ Sharing via email
- ✅ Auto-accept on login
- ✅ Viewing shared playlists
- ✅ Playing shared tracks
- ✅ Rating tracks in shared context
- ✅ Viewing collaborator ratings

## Known Limitations
- Playlist ratings are separate from personal library ratings
- Collaborators cannot edit playlists (by design)
- Maximum 10 collaborators per playlist
- Email invitations not yet implemented (auto-accept on login instead)

## Troubleshooting

### "No shared playlists" appears
- Verify the share was created in the database
- Check that you're logged in with the correct email
- Try logging out and back in to trigger auto-accept

### Tracks won't play
- Check browser console for errors
- Verify the edge function is deployed
- Ensure tracks have valid storage_path values

### Ratings not appearing
- Confirm can_rate is true for the share
- Check that the rating was saved to playlist_track_ratings
- Refresh the page to see updated ratings