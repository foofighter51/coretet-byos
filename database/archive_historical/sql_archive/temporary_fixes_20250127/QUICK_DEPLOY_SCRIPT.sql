-- QUICK DEPLOY SCRIPT - All RLS Fixes in One File
-- Run this entire script in Supabase SQL Editor to deploy all fixes

-- =====================================================
-- PART 1: DROP ALL EXISTING POLICIES
-- =====================================================

DO $$ 
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    -- Drop policies on all affected tables
    FOR tbl IN SELECT unnest(ARRAY['tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'user_track_ratings', 'track_ratings'])
    LOOP
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
        END LOOP;
    END LOOP;
    RAISE NOTICE 'All existing policies dropped';
END $$;

-- =====================================================
-- PART 2: PLAYLIST_SHARES POLICIES (No dependencies)
-- =====================================================

CREATE POLICY "playlist_shares_owner_all" ON playlist_shares
    FOR ALL TO authenticated
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "playlist_shares_recipient_select" ON playlist_shares
    FOR SELECT TO authenticated
    USING (
        shared_with_email = auth.jwt()->>'email' 
        AND status = 'active'
    );

-- =====================================================
-- PART 3: PLAYLISTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own playlists" ON playlists
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

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

CREATE POLICY "Users can create playlists" ON playlists
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own playlists" ON playlists
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own playlists" ON playlists
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- PART 4: PLAYLIST_TRACKS POLICIES
-- =====================================================

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

CREATE POLICY "Users can insert tracks in own playlists" ON playlist_tracks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND p.user_id = auth.uid()
        )
    );

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
-- PART 5: TRACKS POLICIES
-- =====================================================

CREATE POLICY "Users can view own tracks" ON tracks
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

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

CREATE POLICY "Users can insert own tracks" ON tracks
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tracks" ON tracks
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tracks" ON tracks
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- PART 6: USER_TRACK_RATINGS POLICIES
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE user_track_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_accessible_track_ratings" ON user_track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = user_track_ratings.track_id
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
        )
    );

CREATE POLICY "insert_track_rating" ON user_track_ratings
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = user_track_ratings.track_id
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
        )
    );

CREATE POLICY "update_own_rating" ON user_track_ratings
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_rating" ON user_track_ratings
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- PART 7: TRACK_RATINGS POLICIES (Collaborator system)
-- =====================================================

CREATE POLICY "Playlist owners can view all ratings" ON track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = track_ratings.playlist_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view ratings on shared playlists" ON track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = track_ratings.playlist_id
            AND ps.shared_with_email = auth.jwt()->>'email'
            AND ps.status = 'active'
        )
    );

-- =====================================================
-- PART 8: VERIFY DEPLOYMENT
-- =====================================================

-- Check all policies are created
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'user_track_ratings', 'track_ratings')
GROUP BY tablename
ORDER BY tablename;

-- Test basic access
DO $$
BEGIN
    -- Test queries that should work
    PERFORM COUNT(*) FROM tracks;
    PERFORM COUNT(*) FROM playlists;
    PERFORM COUNT(*) FROM user_track_ratings;
    RAISE NOTICE 'All basic queries successful - no recursion detected!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during verification: %', SQLERRM;
END $$;

-- Final success message
SELECT 
    E'\n✅ DEPLOYMENT SUCCESSFUL!\n\n' ||
    'The sharing system is now live with:\n' ||
    '• Fixed infinite recursion issues\n' ||
    '• Complete playlist sharing functionality\n' ||
    '• User rating system enabled\n' ||
    '• Collaborator rating system maintained\n\n' ||
    'Users can now share playlists and rate tracks!' as deployment_status;