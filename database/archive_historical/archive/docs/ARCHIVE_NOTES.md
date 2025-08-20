# CoreTet Archive Notes

## Version 2.1.0 - Shared Playlists (2025-07-28)

### Tag: `v2.1.0-shared-playlists`
### Backup: `backups/coretet-v2.1.0-20250728-141315.tar.gz`

### Features Implemented:
- **Playlist Sharing System**
  - Email-based sharing with auto-accept on login
  - Share status tracking (pending/active)
  - RLS policies for secure shared access
  
- **Mobile UI Improvements**
  - Logout functionality
  - Desktop/Mobile view switching
  - Fixed rating icons (Star for liked, Heart for loved)
  - Double-tap to play tracks
  - Single tap to select tracks
  
- **Edge Functions**
  - Fixed `get-track-urls` to support shared playlists
  - Proper access verification through playlist_shares table
  
- **Database Schema**
  - `playlist_shares` table with proper constraints
  - Updated RLS policies on all tables
  - Auto-accept function trigger

### Known Working State:
- Playlist sharing fully functional
- Audio playback works in both owned and shared playlists
- Mobile UI responsive and functional
- All RLS policies properly configured

### To Revert:
```bash
# Using git tag
git checkout v2.1.0-shared-playlists

# Or restore from backup
tar -xzf backups/coretet-v2.1.0-20250728-141315.tar.gz
```

### SQL Files Created (for reference):
- Multiple diagnostic and fix scripts in root directory
- Can be archived separately if needed