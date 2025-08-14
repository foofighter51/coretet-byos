-- FIX RLS RECURSION - FINAL SOLUTION
-- This completely rebuilds RLS policies to prevent infinite recursion
-- Uses hierarchical approach with EXISTS subqueries

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all policies on tracks
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'tracks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tracks', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on playlists
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'playlists'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlists', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on playlist_tracks
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'playlist_tracks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlist_tracks', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on playlist_shares
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'playlist_shares'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlist_shares', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: CREATE PLAYLIST_SHARES POLICIES (No dependencies)
-- =====================================================

-- Owners can manage their shares
CREATE POLICY "playlist_shares_owner_all" ON playlist_shares
    FOR ALL TO authenticated
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

-- Recipients can view shares sent to them
CREATE POLICY "playlist_shares_recipient_select" ON playlist_shares
    FOR SELECT TO authenticated
    USING (
        shared_with_email = auth.jwt()->>'email' 
        AND status = 'active'
    );

-- =====================================================
-- STEP 3: CREATE PLAYLISTS POLICIES
-- =====================================================

-- Owners can do everything with their playlists
CREATE POLICY "playlists_owner_all" ON playlists
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can view playlists shared with them
CREATE POLICY "playlists_shared_select" ON playlists
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND ps.shared_with_email = auth.jwt()->>'email'
            AND ps.status = 'active'
        )
    );

-- =====================================================
-- STEP 4: CREATE PLAYLIST_TRACKS POLICIES
-- =====================================================

-- Users can manage playlist_tracks for playlists they own
CREATE POLICY "playlist_tracks_owner_all" ON playlist_tracks
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

-- Users can view playlist_tracks for shared playlists
CREATE POLICY "playlist_tracks_shared_select" ON playlist_tracks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND EXISTS (
                SELECT 1 FROM playlist_shares ps
                WHERE ps.playlist_id = p.id
                AND ps.shared_with_email = auth.jwt()->>'email'
                AND ps.status = 'active'
            )
        )
    );

-- =====================================================
-- STEP 5: CREATE TRACKS POLICIES
-- =====================================================

-- Owners can do everything with their tracks
CREATE POLICY "tracks_owner_all" ON tracks
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can view tracks that are in playlists shared with them
CREATE POLICY "tracks_in_shared_playlists_select" ON tracks
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

-- =====================================================
-- STEP 6: VERIFY POLICIES
-- =====================================================

-- Check policy count and names
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 7: TEST QUERIES
-- =====================================================

-- Test 1: Can users see their own tracks?
SELECT 'Own tracks visible' as test, COUNT(*) as count
FROM tracks
WHERE user_id = auth.uid();

-- Test 2: Can users see their own playlists?
SELECT 'Own playlists visible' as test, COUNT(*) as count
FROM playlists
WHERE user_id = auth.uid();

-- Test 3: Can users see shares sent to them?
SELECT 'Incoming shares visible' as test, COUNT(*) as count
FROM playlist_shares
WHERE shared_with_email = auth.jwt()->>'email'
AND status = 'active';

-- Test 4: Complex query - get all visible tracks (owned + shared)
WITH visible_tracks AS (
    -- Own tracks
    SELECT id, name, 'owned' as access_type
    FROM tracks
    WHERE user_id = auth.uid()
    
    UNION
    
    -- Tracks in shared playlists
    SELECT DISTINCT t.id, t.name, 'shared' as access_type
    FROM tracks t
    JOIN playlist_tracks pt ON pt.track_id = t.id
    JOIN playlists p ON p.id = pt.playlist_id
    JOIN playlist_shares ps ON ps.playlist_id = p.id
    WHERE ps.shared_with_email = auth.jwt()->>'email'
    AND ps.status = 'active'
)
SELECT access_type, COUNT(*) as count
FROM visible_tracks
GROUP BY access_type;

-- =====================================================
-- NOTES ON THE SOLUTION
-- =====================================================

/*
This solution prevents recursion by:

1. playlist_shares policies don't check any other tables
2. playlists policies only check playlist_shares (one level)
3. playlist_tracks policies only check playlists (one level) 
4. tracks policies check playlist_tracks -> playlists -> playlist_shares (three levels, but no cycles)

The hierarchy is:
- playlist_shares (base level, no dependencies)
- playlists (depends on playlist_shares)
- playlist_tracks (depends on playlists)
- tracks (depends on playlist_tracks)

No circular dependencies exist because we never check "backwards" in the hierarchy.
*/