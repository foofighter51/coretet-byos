-- COMPLETE SHARING SYSTEM IMPLEMENTATION
-- This implements the full sharing system with all required policies
-- Must be run AFTER FIX_RLS_RECURSION_FINAL.sql

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES (CLEAN START)
-- =====================================================

-- Drop all policies on all affected tables
DO $$ 
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'track_ratings'])
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

-- Users can manage tracks in own playlists (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can manage tracks in own playlists" ON playlist_tracks
    FOR ALL TO authenticated
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
-- STEP 6: TRACK_RATINGS TABLE POLICIES
-- =====================================================

-- Users can view all ratings for tracks they can access
CREATE POLICY "Users can view ratings for accessible tracks" ON track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = track_ratings.track_id
            AND (
                t.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM playlist_tracks pt
                    WHERE pt.track_id = t.id
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
            )
        )
    );

-- Users can rate tracks they can access
CREATE POLICY "Users can rate tracks they can access" ON track_ratings
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = track_ratings.track_id
            AND (
                t.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM playlist_tracks pt
                    WHERE pt.track_id = t.id
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
            )
        )
    );

-- Users can update own ratings
CREATE POLICY "Users can update own ratings" ON track_ratings
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete own ratings
CREATE POLICY "Users can delete own ratings" ON track_ratings
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- STEP 7: VERIFY ALL POLICIES ARE CREATED
-- =====================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, E'\n  - ' ORDER BY policyname) as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'track_ratings')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 8: CREATE HELPER VIEWS (OPTIONAL)
-- =====================================================

-- View for all tracks a user can access (owned + shared)
CREATE OR REPLACE VIEW user_accessible_tracks AS
SELECT DISTINCT
    t.*,
    CASE 
        WHEN t.user_id = auth.uid() THEN 'owned'
        ELSE 'shared'
    END as access_type
FROM tracks t
WHERE 
    t.user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM playlist_tracks pt
        JOIN playlists p ON p.id = pt.playlist_id
        JOIN playlist_shares ps ON ps.playlist_id = p.id
        WHERE pt.track_id = t.id
        AND ps.shared_with_email = auth.jwt()->>'email'
        AND ps.status = 'active'
    );

-- Grant access to the view
GRANT SELECT ON user_accessible_tracks TO authenticated;

-- =====================================================
-- NOTES
-- =====================================================

/*
Policy Hierarchy (prevents recursion):
1. playlist_shares - No dependencies on other tables
2. playlists - Only depends on playlist_shares
3. playlist_tracks - Only depends on playlists (which may check playlist_shares)
4. tracks - Only depends on playlist_tracks → playlists → playlist_shares
5. track_ratings - Only depends on tracks (which follows the above chain)

This ensures unidirectional flow with no circular dependencies.
*/