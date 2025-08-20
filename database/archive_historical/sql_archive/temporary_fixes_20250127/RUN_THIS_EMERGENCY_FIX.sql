-- EMERGENCY FIX ACCESS - RUN THIS NOW
-- This will restore basic functionality with simple policies

-- =====================================================
-- STEP 1: DROP ALL COMPLEX POLICIES
-- =====================================================

DO $$ 
DECLARE
    pol RECORD;
    tbl TEXT;
BEGIN
    -- Drop all existing policies on our core tables
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
    RAISE NOTICE 'All complex policies dropped';
END $$;

-- =====================================================
-- STEP 2: CREATE SIMPLE OWNER-ONLY POLICIES
-- =====================================================

-- TRACKS: Users can only see/manage their own tracks
CREATE POLICY "tracks_owner_select" ON tracks
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "tracks_owner_insert" ON tracks
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_owner_update" ON tracks
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_owner_delete" ON tracks
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- PLAYLISTS: Users can only see/manage their own playlists
CREATE POLICY "playlists_owner_select" ON playlists
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "playlists_owner_insert" ON playlists
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_owner_update" ON playlists
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_owner_delete" ON playlists
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- PLAYLIST_TRACKS: Users can manage tracks in their own playlists
CREATE POLICY "playlist_tracks_owner_all" ON playlist_tracks
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

-- PLAYLIST_SHARES: Users can manage their own shares
CREATE POLICY "playlist_shares_owner_select" ON playlist_shares
    FOR SELECT TO authenticated
    USING (shared_by = auth.uid());

CREATE POLICY "playlist_shares_owner_insert" ON playlist_shares
    FOR INSERT TO authenticated
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "playlist_shares_owner_delete" ON playlist_shares
    FOR DELETE TO authenticated
    USING (shared_by = auth.uid());

-- =====================================================
-- STEP 3: VERIFY THE FIX
-- =====================================================

-- Check what policies we now have
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
GROUP BY tablename
ORDER BY tablename;

-- Test that queries work now
SELECT 'Testing access...' as status;

SELECT 
    'Tracks I can see:' as test,
    COUNT(*) as count
FROM tracks
WHERE user_id = auth.uid();

SELECT 
    'Playlists I can see:' as test,
    COUNT(*) as count
FROM playlists
WHERE user_id = auth.uid();

-- =====================================================
-- STEP 4: SUCCESS MESSAGE
-- =====================================================

SELECT 
    E'\n✅ EMERGENCY FIX APPLIED!\n\n' ||
    'Basic functionality restored:\n' ||
    '• Users can see their own tracks\n' ||
    '• Users can see their own playlists\n' ||
    '• Users can manage their own content\n' ||
    '• Sharing features temporarily disabled\n\n' ||
    'Your app should now load properly!' as result;