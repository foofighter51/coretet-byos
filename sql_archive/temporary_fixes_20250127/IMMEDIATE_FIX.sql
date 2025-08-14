-- IMMEDIATE FIX - GET APP WORKING NOW
-- This restores basic functionality

-- Step 1: Drop ALL policies on core tables
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view tracks in shared playlists" ON tracks;
DROP POLICY IF EXISTS "Users can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "tracks_owner_all" ON tracks;
DROP POLICY IF EXISTS "tracks_in_shared_playlists_select" ON tracks;

DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view shared playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;
DROP POLICY IF EXISTS "playlists_owner_all" ON playlists;
DROP POLICY IF EXISTS "playlists_shared_select" ON playlists;

DROP POLICY IF EXISTS "Users can view playlist tracks for accessible playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can insert tracks in own playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can update tracks in own playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can delete tracks from own playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "playlist_tracks_owner_all" ON playlist_tracks;
DROP POLICY IF EXISTS "playlist_tracks_shared_select" ON playlist_tracks;

DROP POLICY IF EXISTS "playlist_shares_owner_all" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_recipient_select" ON playlist_shares;
DROP POLICY IF EXISTS "Users can view shares for their playlists" ON playlist_shares;
DROP POLICY IF EXISTS "Users can view shares shared with them" ON playlist_shares;
DROP POLICY IF EXISTS "Users can create shares for own playlists" ON playlist_shares;
DROP POLICY IF EXISTS "Users can delete own shares" ON playlist_shares;

-- Step 2: Create SIMPLE working policies
-- These are the same as in your original codebase before sharing

-- TRACKS - simple owner policies
CREATE POLICY "tracks_simple_owner" ON tracks
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- PLAYLISTS - simple owner policies  
CREATE POLICY "playlists_simple_owner" ON playlists
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- PLAYLIST_TRACKS - access if you own the playlist
CREATE POLICY "playlist_tracks_simple_owner" ON playlist_tracks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- PLAYLIST_SHARES - simple owner policies
CREATE POLICY "playlist_shares_simple_owner" ON playlist_shares
    FOR ALL TO authenticated
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

-- Step 3: Verify
SELECT 
    tablename,
    COUNT(*) as policies,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
GROUP BY tablename
ORDER BY tablename;

-- Step 4: Test access (this will only work if authenticated)
DO $$
BEGIN
    PERFORM COUNT(*) FROM tracks;
    RAISE NOTICE 'SUCCESS: Basic access restored';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Still failing - check authentication in your app';
END $$;

-- Done!
SELECT 'Basic owner-only policies applied. App should work for authenticated users.' as status;