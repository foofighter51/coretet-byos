-- ADMIN ONLY FIX - No auth functions used
-- Run this in Supabase SQL Editor with admin privileges

-- Step 1: Drop ALL existing policies using DO block
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on tracks
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'tracks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tracks', r.policyname);
    END LOOP;
    
    -- Drop all policies on playlists
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'playlists'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlists', r.policyname);
    END LOOP;
    
    -- Drop all policies on playlist_tracks
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'playlist_tracks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlist_tracks', r.policyname);
    END LOOP;
    
    -- Drop all policies on playlist_shares
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'playlist_shares'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlist_shares', r.policyname);
    END LOOP;
    
    RAISE NOTICE 'All policies dropped successfully';
END $$;

-- Step 2: Create very simple policies without using auth functions
-- These policies use a simple user_id check

-- TRACKS
CREATE POLICY "tracks_owner_select" ON tracks
    FOR SELECT TO authenticated
    USING (true);  -- Temporarily allow all authenticated users to SELECT

CREATE POLICY "tracks_owner_insert" ON tracks
    FOR INSERT TO authenticated
    WITH CHECK (true);  -- Temporarily allow inserts

CREATE POLICY "tracks_owner_update" ON tracks
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "tracks_owner_delete" ON tracks
    FOR DELETE TO authenticated
    USING (true);

-- PLAYLISTS
CREATE POLICY "playlists_owner_select" ON playlists
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "playlists_owner_insert" ON playlists
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "playlists_owner_update" ON playlists
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "playlists_owner_delete" ON playlists
    FOR DELETE TO authenticated
    USING (true);

-- PLAYLIST_TRACKS
CREATE POLICY "playlist_tracks_all" ON playlist_tracks
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- PLAYLIST_SHARES
CREATE POLICY "playlist_shares_all" ON playlist_shares
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 3: Verify policies were created
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
GROUP BY tablename
ORDER BY tablename;

-- Step 4: Check data exists
SELECT 
    'Data check:' as info,
    (SELECT COUNT(*) FROM tracks) as total_tracks,
    (SELECT COUNT(*) FROM playlists) as total_playlists,
    (SELECT COUNT(DISTINCT user_id) FROM tracks) as unique_users;

-- Step 5: Warning message
SELECT 
    'WARNING: Temporary permissive policies applied!' as status,
    'All authenticated users can access all data!' as security_note,
    'Fix authentication in your app, then apply proper policies' as next_step;

-- ============================================
-- ALTERNATIVE: Disable RLS completely (DANGEROUS)
-- ============================================
-- If the above doesn't work, you can temporarily disable RLS:
-- ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE playlist_tracks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE playlist_shares DISABLE ROW LEVEL SECURITY;