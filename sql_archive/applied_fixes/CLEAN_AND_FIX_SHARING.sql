-- CLEAN UP AND FIX SHARING POLICIES
-- Remove all complex policies and create simple ones

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES 
-- =====================================================

-- Drop all playlist_shares policies
DROP POLICY IF EXISTS "Users can view their playlist shares" ON playlist_shares;
DROP POLICY IF EXISTS "Users can create playlist shares" ON playlist_shares;
DROP POLICY IF EXISTS "Users can update their playlist shares" ON playlist_shares;
DROP POLICY IF EXISTS "Users can view shares where they are recipient" ON playlist_shares;

-- Drop all playlist_tracks policies
DROP POLICY IF EXISTS "Enable delete for users own playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Enable insert for users own playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Enable read for users own playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Enable update for users own playlist tracks" ON playlist_tracks;

-- =====================================================
-- STEP 2: CREATE SIMPLE POLICIES FOR playlist_shares
-- =====================================================

-- Owners can do everything with their playlist shares
CREATE POLICY "playlist_shares_owner_all" ON playlist_shares
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

-- Recipients can only view shares sent to them
CREATE POLICY "playlist_shares_recipient_view" ON playlist_shares
    FOR SELECT
    TO authenticated
    USING (
        shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- =====================================================
-- STEP 3: CREATE SIMPLE POLICIES FOR playlist_tracks
-- =====================================================

-- Owners can do everything with their playlist tracks
CREATE POLICY "playlist_tracks_owner_all" ON playlist_tracks
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

-- Recipients can view tracks in shared playlists
CREATE POLICY "playlist_tracks_shared_view" ON playlist_tracks
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

-- =====================================================
-- STEP 4: UPDATE PLAYLISTS POLICIES
-- =====================================================

-- Drop existing simple policy
DROP POLICY IF EXISTS "playlists_owner_all" ON playlists;

-- Owners can do everything with their playlists
CREATE POLICY "playlists_owner_all" ON playlists
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Recipients can view shared playlists
CREATE POLICY "playlists_shared_view" ON playlists
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

-- =====================================================
-- STEP 5: UPDATE TRACKS POLICIES
-- =====================================================

-- Drop existing simple policy
DROP POLICY IF EXISTS "tracks_owner_all" ON tracks;

-- Owners can do everything with their tracks
CREATE POLICY "tracks_owner_all" ON tracks
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Recipients can view tracks in shared playlists
CREATE POLICY "tracks_shared_view" ON tracks
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

-- =====================================================
-- STEP 6: VERIFY ALL POLICIES
-- =====================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_shares', 'playlist_tracks')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 7: TEST SHARING
-- =====================================================

-- Test 1: Can owners see their playlist shares?
SELECT 'Owner shares:' as test, COUNT(*) as count
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE p.user_id = auth.uid();

-- Test 2: Can you see shares sent to you?
SELECT 'Received shares:' as test, COUNT(*) as count
FROM playlist_shares
WHERE shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
AND status = 'active';

-- Test 3: Can you see shared playlists?
SELECT 'Shared playlists:' as test, COUNT(*) as count
FROM playlists p
JOIN playlist_shares ps ON ps.playlist_id = p.id
WHERE ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
AND ps.status = 'active';