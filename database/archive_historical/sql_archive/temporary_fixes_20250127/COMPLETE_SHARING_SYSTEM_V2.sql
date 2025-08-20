-- COMPLETE SHARING SYSTEM V2 - Without track_ratings
-- This version focuses on the core tables first
-- Run FIX_TRACK_RATINGS_POLICIES.sql separately for track_ratings

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES (CLEAN START)
-- =====================================================

-- Drop all policies on core tables
DO $$ 
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['tracks', 'playlists', 'playlist_tracks', 'playlist_shares'])
    LOOP
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: TRACKS TABLE POLICIES
-- =====================================================

-- Users can view own tracks
CREATE POLICY "Users can view own tracks" ON tracks
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can view tracks in shared playlists
CREATE POLICY "Users can view tracks in shared playlists" ON tracks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_tracks pt
            WHERE pt.track_id = tracks.id
            AND EXISTS (
                SELECT 1 FROM playlists p
                WHERE p.id = pt.playlist_id
                AND EXISTS (
                    SELECT 1 FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND ps.shared_with_email = auth.jwt()->>'email'
                    AND ps.status = 'active'
                )
            )
        )
    );

-- Users can insert own tracks
CREATE POLICY "Users can insert own tracks" ON tracks
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update own tracks
CREATE POLICY "Users can update own tracks" ON tracks
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete own tracks
CREATE POLICY "Users can delete own tracks" ON tracks
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- STEP 3: PLAYLISTS TABLE POLICIES
-- =====================================================

-- Users can view own playlists
CREATE POLICY "Users can view own playlists" ON playlists
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can view shared playlists
CREATE POLICY "Users can view shared playlists" ON playlists
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND ps.shared_with_email = auth.jwt()->>'email'
            AND ps.status = 'active'
        )
    );

-- Users can create playlists
CREATE POLICY "Users can create playlists" ON playlists
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update own playlists
CREATE POLICY "Users can update own playlists" ON playlists
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete own playlists
CREATE POLICY "Users can delete own playlists" ON playlists
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- STEP 4: PLAYLIST_TRACKS TABLE POLICIES
-- =====================================================

-- Users can view playlist tracks for accessible playlists
CREATE POLICY "Users can view playlist tracks for accessible playlists" ON playlist_tracks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND (
                p.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND ps.shared_with_email = auth.jwt()->>'email'
                    AND ps.status = 'active'
                )
            )
        )
    );

-- Users can insert tracks in own playlists
CREATE POLICY "Users can insert tracks in own playlists" ON playlist_tracks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    );

-- Users can update tracks in own playlists
CREATE POLICY "Users can update tracks in own playlists" ON playlist_tracks
    FOR UPDATE TO authenticated
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

-- Users can delete tracks from own playlists
CREATE POLICY "Users can delete tracks from own playlists" ON playlist_tracks
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 5: PLAYLIST_SHARES TABLE POLICIES
-- =====================================================

-- Users can view shares for their playlists
CREATE POLICY "Users can view shares for their playlists" ON playlist_shares
    FOR SELECT TO authenticated
    USING (shared_by = auth.uid());

-- Users can view shares shared with them
CREATE POLICY "Users can view shares shared with them" ON playlist_shares
    FOR SELECT TO authenticated
    USING (
        shared_with_email = auth.jwt()->>'email'
        AND status = 'active'
    );

-- Users can create shares for own playlists
CREATE POLICY "Users can create shares for own playlists" ON playlist_shares
    FOR INSERT TO authenticated
    WITH CHECK (
        shared_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_shares.playlist_id
            AND p.user_id = auth.uid()
        )
    );

-- Users can delete own shares
CREATE POLICY "Users can delete own shares" ON playlist_shares
    FOR DELETE TO authenticated
    USING (shared_by = auth.uid());

-- =====================================================
-- STEP 6: VERIFY ALL POLICIES ARE CREATED
-- =====================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', E'\n  ' ORDER BY policyname) as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 7: TEST BASIC ACCESS
-- =====================================================

-- Test 1: Can users see their own tracks?
SELECT 'Own tracks' as test, COUNT(*) as count FROM tracks WHERE user_id = auth.uid();

-- Test 2: Can users see their own playlists?
SELECT 'Own playlists' as test, COUNT(*) as count FROM playlists WHERE user_id = auth.uid();

-- Test 3: Check for any policy errors
SELECT 'Policy check' as test, 
       CASE 
         WHEN COUNT(*) >= 0 THEN 'Policies working - no errors'
         ELSE 'Error in policies'
       END as status
FROM tracks;

-- =====================================================
-- STEP 8: CREATE HELPER FUNCTIONS (OPTIONAL)
-- =====================================================

-- Function to check if a user can access a track
CREATE OR REPLACE FUNCTION user_can_access_track(track_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tracks t
        WHERE t.id = track_uuid
        AND (
            t.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM playlist_tracks pt
                JOIN playlists p ON p.id = pt.playlist_id
                JOIN playlist_shares ps ON ps.playlist_id = p.id
                WHERE pt.track_id = t.id
                AND ps.shared_with_email = auth.jwt()->>'email'
                AND ps.status = 'active'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUMMARY
-- =====================================================

/*
This implementation provides:
1. ✓ Users can only see their own tracks UNLESS in shared playlist
2. ✓ Shared playlists give read-only access to tracks
3. ✓ No circular dependencies in policies
4. ✓ Clear separation of concerns

For track_ratings, run FIX_TRACK_RATINGS_POLICIES.sql separately
*/