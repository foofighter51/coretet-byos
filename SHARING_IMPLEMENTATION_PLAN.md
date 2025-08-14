# CoreTet Sharing Implementation Plan

## Based on Your Requirements

### 1. Collaborators with Accounts ✓
- Leverage existing Supabase Auth
- No anonymous access = better security
- Can track who rates what
- Enables future features (comments, etc.)

### 2. Detailed Ratings (Phased Approach) ✓
- Phase 1: Show aggregated numbers + your own rating
- Phase 2: Show who rated what (with privacy controls)
- Clean UI that doesn't overwhelm on mobile

### 3. Refresh on Load (Mobile-Friendly) ✓
- Aggressive cache busting for mobile
- Pull-to-refresh gesture support
- Visual feedback during refresh
- No infinite spinners!

### 4. Up to 10 Collaborators ✓
- Perfect for small teams/friends
- Easy to show all avatars/names
- No pagination needed initially

## Proposed Architecture

### Database Schema (Simple & Secure)

```sql
-- 1. Playlist sharing table
CREATE TABLE playlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id),
  shared_with_email TEXT NOT NULL,
  share_status TEXT DEFAULT 'pending' CHECK (share_status IN ('pending', 'accepted', 'declined')),
  can_rate BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,  -- future capability
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique shares
  UNIQUE(playlist_id, shared_with_email)
);

-- 2. Simple RLS policies
-- Owners can share their playlists
CREATE POLICY "Owners can share playlists" ON playlist_shares
  FOR INSERT 
  WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = playlist_id 
      AND user_id = auth.uid()
    )
  );

-- Users can see shares for them
CREATE POLICY "Users see their shares" ON playlist_shares
  FOR SELECT
  USING (
    shared_by = auth.uid() OR 
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
```

### Mobile UI Flow

```
1. Share Playlist:
   [Share Button] → Modal:
   ┌─────────────────────────┐
   │ Share "Summer Vibes"    │
   │                         │
   │ Email: ___________      │
   │                         │
   │ ☑ Allow rating          │
   │ ☐ Allow editing         │
   │                         │
   │ [Cancel] [Send Invite]  │
   └─────────────────────────┘

2. Recipient Experience:
   - Email with link
   - Opens PWA
   - If not logged in → Sign up/Login
   - Auto-accepts share
   - Sees playlist immediately

3. Shared Playlist View:
   ┌─────────────────────────┐
   │ 🎵 Summer Vibes         │
   │ Shared by Eric          │
   │                         │
   │ Collaborators (3):      │
   │ 👤 Eric ⭐️ Amy 🎵 Dan    │
   │                         │
   │ Track List...           │
   └─────────────────────────┘
```

### Rating Display Evolution

**Phase 1 (Launch):**
```
Track: "Midnight Dreams"
⭐️ Liked by 3 people (including you)
[Your Rating: ❤️ Loved]
```

**Phase 2 (Later):**
```
Track: "Midnight Dreams"
Ratings:
👤 Eric: ❤️ Loved
👤 Amy: ⭐️ Liked  
👤 Dan: 🎧 Listened
```

### Mobile-Specific Solutions

1. **Refresh Reliability:**
   ```typescript
   // Force refresh with cache bypass
   const refreshPlaylist = async () => {
     // Clear local cache
     queryClient.invalidateQueries(['playlist', playlistId]);
     
     // Add timestamp to bypass CDN/browser cache
     const { data } = await supabase
       .from('playlists')
       .select('*, playlist_tracks(*)')
       .eq('id', playlistId)
       .single()
       .throwOnError();
       
     // Visual feedback
     showToast('Playlist updated!');
   };
   ```

2. **Pull-to-Refresh:**
   ```typescript
   // Using react-pull-to-refresh
   <PullToRefresh onRefresh={refreshPlaylist}>
     <PlaylistContent />
   </PullToRefresh>
   ```

3. **Optimistic Updates:**
   ```typescript
   // Update UI immediately, sync in background
   const rateTrack = async (rating) => {
     // Update local state first
     setLocalRating(rating);
     
     // Then sync to database
     await updateRating(rating);
   };
   ```

### Security Model

1. **Invitation Flow:**
   - Owner sends invite via email
   - Recipient must have/create account
   - Share auto-accepts on first login
   - No public/anonymous access

2. **Access Control:**
   - RLS ensures users only see their content
   - Shared playlists visible to invited users
   - Ratings scoped to playlist context
   - No cross-playlist data leakage

3. **Edge Function Updates:**
   ```typescript
   // get-track-url validates shared access
   const hasAccess = await checkPlaylistAccess(userId, trackId);
   if (!hasAccess) {
     return new Response('Unauthorized', { status: 403 });
   }
   ```

### Implementation Steps

1. **Week 1: Core Sharing**
   - [ ] Create playlist_shares table
   - [ ] Add sharing UI to playlist menu
   - [ ] Email invitation system
   - [ ] Update RLS policies

2. **Week 2: Mobile Experience**
   - [ ] Share acceptance flow
   - [ ] Collaborator display
   - [ ] Pull-to-refresh
   - [ ] Offline handling

3. **Week 3: Enhanced Ratings**
   - [ ] Show rating counts
   - [ ] Update rating UI for context
   - [ ] Add collaborator avatars
   - [ ] Test with 10 users

### Avoiding Previous Issues

1. **No Infinite Loops:**
   - Simple, direct RLS policies
   - No recursive checks
   - Clear ownership model

2. **Mobile-First Design:**
   - Large touch targets
   - Minimal network calls
   - Progressive enhancement
   - Clear loading states

3. **Performance:**
   - Indexed on (playlist_id, shared_with_email)
   - Minimal joins in queries
   - Client-side caching
   - Batch rating updates

### Success Metrics

- Share acceptance rate > 80%
- Mobile refresh success > 95%
- Rating participation > 50%
- No infinite spinners!
- Page load < 2 seconds

This approach gives you secure collaboration while keeping the system simple and mobile-friendly. The phased approach lets us launch quickly and enhance based on real usage.

Thoughts on this plan?