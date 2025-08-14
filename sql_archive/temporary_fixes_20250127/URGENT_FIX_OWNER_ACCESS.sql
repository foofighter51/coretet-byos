-- URGENT: FIX OWNER ACCESS THAT BROKE WITH SHARING

-- 1. Check current policies on tracks
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'tracks'
ORDER BY policyname;

-- 2. The issue: We probably need FOR ALL split into separate operations
-- Let's fix tracks first

DROP POLICY IF EXISTS "tracks_owner" ON tracks;
DROP POLICY IF EXISTS "tracks_shared" ON tracks;

-- Create separate policies for each operation
CREATE POLICY "tracks_select_own" ON tracks
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "tracks_insert_own" ON tracks
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_update_own" ON tracks
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_delete_own" ON tracks
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Add the shared view policy
CREATE POLICY "tracks_select_shared" ON tracks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_tracks pt
            JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
            WHERE pt.track_id = tracks.id
            AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND ps.status = 'active'
        )
    );

-- 3. Test if you can see your tracks now
SELECT COUNT(*) as your_tracks
FROM tracks
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- 4. Do the same for playlists
DROP POLICY IF EXISTS "playlists_owner" ON playlists;
DROP POLICY IF EXISTS "playlists_shared" ON playlists;

CREATE POLICY "playlists_select_own" ON playlists
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "playlists_insert_own" ON playlists
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_update_own" ON playlists
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_delete_own" ON playlists
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "playlists_select_shared" ON playlists
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND ps.status = 'active'
        )
    );

-- 5. Verify the policies
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists')
GROUP BY tablename
ORDER BY tablename;