-- EMERGENCY FIX - Restore Basic Access
-- Run this immediately to restore app functionality

-- =====================================================
-- STEP 1: Check current user and policies
-- =====================================================

-- Get current auth status
SELECT 
    auth.uid() as current_user_id,
    auth.jwt()->>'email' as current_user_email,
    auth.jwt() is not null as is_authenticated;

-- Check what policies exist
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 2: Apply simpler policies that definitely work
-- =====================================================

-- Drop complex policies
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

-- Create simple owner-only policies first to restore access

-- TRACKS: Simple owner policies
CREATE POLICY "tracks_select_own" ON tracks
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "tracks_insert_own" ON tracks
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_update_own" ON tracks
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_delete_own" ON tracks
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- PLAYLISTS: Simple owner policies
CREATE POLICY "playlists_select_own" ON playlists
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "playlists_insert_own" ON playlists
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_update_own" ON playlists
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_delete_own" ON playlists
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- PLAYLIST_TRACKS: Allow access to tracks in own playlists
CREATE POLICY "playlist_tracks_all_own" ON playlist_tracks
    FOR ALL TO authenticated
    USING (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );

-- PLAYLIST_SHARES: Simple policies
CREATE POLICY "playlist_shares_select_own" ON playlist_shares
    FOR SELECT TO authenticated
    USING (shared_by = auth.uid());

CREATE POLICY "playlist_shares_insert_own" ON playlist_shares
    FOR INSERT TO authenticated
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "playlist_shares_delete_own" ON playlist_shares
    FOR DELETE TO authenticated
    USING (shared_by = auth.uid());

-- =====================================================
-- STEP 3: Test basic access
-- =====================================================

-- These should now work
SELECT 'Testing track access' as test, COUNT(*) as count FROM tracks WHERE user_id = auth.uid();
SELECT 'Testing playlist access' as test, COUNT(*) as count FROM playlists WHERE user_id = auth.uid();

-- =====================================================
-- STEP 4: Check for specific user data
-- =====================================================

-- Check if the main user has data
SELECT 
    'User data check' as check_type,
    (SELECT COUNT(*) FROM tracks WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766') as ericexley_tracks,
    (SELECT COUNT(*) FROM playlists WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766') as ericexley_playlists;

-- =====================================================
-- STEP 5: Verify policies are working
-- =====================================================

EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name FROM tracks LIMIT 1;

-- Final status
SELECT 'Emergency fix applied - basic owner access restored' as status;