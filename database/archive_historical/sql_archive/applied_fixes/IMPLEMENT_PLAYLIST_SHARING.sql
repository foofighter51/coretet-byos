-- IMPLEMENT PLAYLIST SHARING WITH SIMPLE RLS POLICIES
-- Following the same simple approach that fixed the visibility issue

-- =====================================================
-- STEP 1: CHECK CURRENT POLICIES ON playlist_shares
-- =====================================================

SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'playlist_shares'
ORDER BY policyname;

-- =====================================================
-- STEP 2: DROP ALL EXISTING POLICIES (clean slate)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their playlist shares" ON playlist_shares;
DROP POLICY IF EXISTS "Users can create playlist shares" ON playlist_shares;
DROP POLICY IF EXISTS "Users can update their playlist shares" ON playlist_shares;
DROP POLICY IF EXISTS "Users can view shares where they are recipient" ON playlist_shares;

-- =====================================================
-- STEP 3: CREATE SIMPLE POLICIES FOR SHARING
-- =====================================================

-- Policy 1: Playlist owners can manage all shares for their playlists
CREATE POLICY "playlist_owners_manage_shares" ON playlist_shares
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_shares.playlist_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_shares.playlist_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy 2: Recipients can view shares sent to them
CREATE POLICY "recipients_view_shares" ON playlist_shares
    FOR SELECT
    TO authenticated
    USING (
        shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- =====================================================
-- STEP 4: UPDATE PLAYLISTS POLICY TO INCLUDE SHARED
-- =====================================================

-- Drop the simple owner-only policy
DROP POLICY IF EXISTS "playlists_owner_all" ON playlists;

-- Create new policy that allows viewing owned OR shared playlists
CREATE POLICY "playlists_owned_or_shared" ON playlists
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND ps.status = 'active'
        )
    );

-- Keep the owner-only policy for INSERT, UPDATE, DELETE
CREATE POLICY "playlists_owner_modify" ON playlists
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_owner_update" ON playlists
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_owner_delete" ON playlists
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- STEP 5: UPDATE TRACKS POLICY TO INCLUDE SHARED
-- =====================================================

-- Drop the simple owner-only policy
DROP POLICY IF EXISTS "tracks_owner_all" ON tracks;

-- Create new policy that allows viewing owned OR shared tracks
CREATE POLICY "tracks_owned_or_shared" ON tracks
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM playlist_tracks pt
            JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
            WHERE pt.track_id = tracks.id
            AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND ps.status = 'active'
        )
    );

-- Keep owner-only policies for modifications
CREATE POLICY "tracks_owner_insert" ON tracks
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_owner_update" ON tracks
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_owner_delete" ON tracks
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- STEP 6: POLICIES FOR playlist_tracks (read shared)
-- =====================================================

-- Check existing policies
SELECT policyname FROM pg_policies WHERE tablename = 'playlist_tracks';

-- Create policy for viewing playlist tracks (owned or shared playlists)
CREATE POLICY IF NOT EXISTS "view_playlist_tracks" ON playlist_tracks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND (
                p.user_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1 FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
                    AND ps.status = 'active'
                )
            )
        )
    );

-- Only owners can modify playlist tracks
CREATE POLICY IF NOT EXISTS "owners_modify_playlist_tracks" ON playlist_tracks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "owners_update_playlist_tracks" ON playlist_tracks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "owners_delete_playlist_tracks" ON playlist_tracks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 7: VERIFY ALL POLICIES
-- =====================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', ', ') as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_shares', 'playlist_tracks')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 8: TEST QUERIES
-- =====================================================

-- Test: Can playlist owners see their shares?
SELECT COUNT(*) as owner_shares
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE p.user_id = auth.uid();

-- Test: Can recipients see shares sent to them?
SELECT COUNT(*) as received_shares
FROM playlist_shares
WHERE shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
AND status = 'active';