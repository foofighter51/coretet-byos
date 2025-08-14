-- FIX PLAYLIST_TRACKS POLICIES ONLY

-- Drop existing policies on playlist_tracks
DROP POLICY IF EXISTS "playlist_tracks_owner" ON playlist_tracks;
DROP POLICY IF EXISTS "playlist_tracks_shared" ON playlist_tracks;

-- Create the two policies for playlist_tracks
CREATE POLICY "playlist_tracks_owner" ON playlist_tracks
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "playlist_tracks_shared" ON playlist_tracks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = playlist_tracks.playlist_id
            AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND ps.status = 'active'
        )
    );

-- Verify the policies
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'playlist_tracks'
ORDER BY policyname;