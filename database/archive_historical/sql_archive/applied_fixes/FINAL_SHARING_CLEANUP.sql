-- FINAL CLEANUP - REMOVE ALL DUPLICATE POLICIES

-- =====================================================
-- STEP 1: DROP ALL POLICIES (COMPLETE RESET)
-- =====================================================

-- Drop ALL policies on playlist_shares
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

-- Drop ALL policies on playlist_tracks
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

-- Drop ALL policies on playlists
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

-- Drop ALL policies on tracks
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

-- =====================================================
-- STEP 2: CREATE CLEAN, SIMPLE POLICIES
-- =====================================================

-- TRACKS: Two policies only
CREATE POLICY "tracks_owner" ON tracks
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracks_shared" ON tracks
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

-- PLAYLISTS: Two policies only
CREATE POLICY "playlists_owner" ON playlists
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_shared" ON playlists
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

-- PLAYLIST_SHARES: Two policies only
CREATE POLICY "playlist_shares_owner" ON playlist_shares
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

CREATE POLICY "playlist_shares_recipient" ON playlist_shares
    FOR SELECT
    TO authenticated
    USING (
        shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- PLAYLIST_TRACKS: Two policies only
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

-- =====================================================
-- STEP 3: VERIFY - SHOULD BE EXACTLY 2 PER TABLE
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
-- STEP 4: CREATE A TEST SHARE
-- =====================================================

-- First, check if you have any playlists
SELECT id, name, user_id FROM playlists WHERE user_id = auth.uid() LIMIT 5;

-- If you have a playlist, manually create a test share
-- Replace PLAYLIST_ID with an actual playlist ID from above
/*
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email,
    status
) VALUES (
    'PLAYLIST_ID',
    auth.uid(),
    'test@example.com',
    'active'
);
*/

-- =====================================================
-- STEP 5: TEST QUERIES
-- =====================================================

-- Should show your shares
SELECT 
    ps.id,
    p.name as playlist_name,
    ps.shared_with_email,
    ps.status
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE p.user_id = auth.uid();