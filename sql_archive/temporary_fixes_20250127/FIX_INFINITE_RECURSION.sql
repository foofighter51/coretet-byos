-- EMERGENCY FIX: INFINITE RECURSION IN POLICIES

-- The issue: tracks policy references playlist_shares, which references playlists, 
-- which might reference back creating a loop

-- 1. DROP ALL POLICIES TO STOP THE RECURSION
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on all affected tables
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('tracks', 'playlists', 'playlist_shares', 'playlist_tracks')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. CREATE SIMPLE NON-RECURSIVE POLICIES

-- TRACKS: Owner only (no sharing for now)
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

-- PLAYLISTS: Owner only (no sharing for now)
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

-- PLAYLIST_SHARES: Simple policies
CREATE POLICY "playlist_shares_owner_all" ON playlist_shares
    FOR ALL TO authenticated
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "playlist_shares_recipient_view" ON playlist_shares
    FOR SELECT TO authenticated
    USING (shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- PLAYLIST_TRACKS: Owner only for now
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

-- 3. VERIFY NO RECURSION
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_shares', 'playlist_tracks')
GROUP BY tablename
ORDER BY tablename;

-- 4. TEST ACCESS
SELECT COUNT(*) as track_count FROM tracks WHERE user_id = auth.uid();
SELECT COUNT(*) as playlist_count FROM playlists WHERE user_id = auth.uid();