-- FIX PLAYLIST SHARED ACCESS
-- Add RLS policy so users can see playlists shared with them

-- 1. Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;

-- 2. Create new policy that includes shared access
CREATE POLICY "Users can view own and shared playlists" ON playlists
    FOR SELECT
    USING (
        -- User owns the playlist
        user_id = auth.uid()
        OR
        -- Playlist is shared with user (active shares only)
        EXISTS (
            SELECT 1 
            FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND LOWER(ps.shared_with_email) = LOWER(auth.email())
            AND ps.status = 'active'
        )
    );

-- 3. Keep other policies as they are
-- (insert, update, delete should only work for owners)

-- 4. Test the policy
SELECT 
    'Policy Test' as section,
    p.id,
    p.name,
    p.user_id,
    CASE 
        WHEN p.user_id = auth.uid() THEN 'Owner'
        WHEN EXISTS (
            SELECT 1 FROM playlist_shares 
            WHERE playlist_id = p.id 
            AND LOWER(shared_with_email) = LOWER(auth.email())
            AND status = 'active'
        ) THEN 'Shared'
        ELSE 'No Access'
    END as access_type
FROM playlists p
WHERE p.user_id = auth.uid()
   OR EXISTS (
       SELECT 1 FROM playlist_shares 
       WHERE playlist_id = p.id 
       AND LOWER(shared_with_email) = LOWER(auth.email())
       AND status = 'active'
   );

-- 5. Also check playlist_tracks access
DROP POLICY IF EXISTS "Users can view tracks in their playlists" ON playlist_tracks;

CREATE POLICY "Users can view tracks in accessible playlists" ON playlist_tracks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND (
                -- User owns the playlist
                p.user_id = auth.uid()
                OR
                -- Playlist is shared with user
                EXISTS (
                    SELECT 1 
                    FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
                    AND ps.status = 'active'
                )
            )
        )
    );