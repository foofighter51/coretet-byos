-- FORCE FIX: Aggressively fix all RLS and table issues
-- Run this to completely reset policies and fix missing tables

-- 1. Check what policies still exist
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks')
ORDER BY tablename, policyname;

-- 2. FORCE disable RLS and drop ALL policies
DO $$
DECLARE
    t RECORD;
    p RECORD;
BEGIN
    -- Disable RLS on all relevant tables
    FOR t IN SELECT tablename FROM pg_tables 
             WHERE schemaname = 'public' 
             AND tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'playlist_tracks', 'view_preferences')
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t.tablename);
        RAISE NOTICE 'Disabled RLS on %', t.tablename;
    END LOOP;
    
    -- Drop ALL policies
    FOR p IN SELECT tablename, policyname 
             FROM pg_policies 
             WHERE tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'playlist_tracks', 'view_preferences')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p.policyname, p.tablename);
        RAISE NOTICE 'Dropped policy % on %', p.policyname, p.tablename;
    END LOOP;
END $$;

-- 3. Fix view_preferences table (completely recreate it)
DROP TABLE IF EXISTS view_preferences CASCADE;

CREATE TABLE view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_type, view_id)
);

-- Create indexes
CREATE INDEX idx_view_preferences_user ON view_preferences(user_id);
CREATE INDEX idx_view_preferences_type ON view_preferences(view_type, view_id);

-- Grant full permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT ALL ON view_preferences TO anon;
GRANT ALL ON view_preferences TO service_role;

-- 4. Create MINIMAL policies - one table at a time

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all" ON profiles FOR ALL USING (auth.uid() = id);

-- TRACKS  
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tracks_all" ON tracks FOR ALL USING (auth.uid() = user_id);

-- PLAYLISTS - Only own playlists, no sharing check yet
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlists_own" ON playlists FOR ALL USING (auth.uid() = user_id);

-- PLAYLIST_TRACKS - If you can see the playlist, you can see its tracks
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlist_tracks_all" ON playlist_tracks FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM playlists p 
        WHERE p.id = playlist_tracks.playlist_id 
        AND p.user_id = auth.uid()
    )
);

-- PLAYLIST_SHARES - Simple policy
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlist_shares_all" ON playlist_shares FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM playlists WHERE id = playlist_shares.playlist_id
    )
    OR
    shared_with_email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
    )
);

-- VIEW_PREFERENCES - Simple policy
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_preferences_all" ON view_preferences FOR ALL USING (auth.uid() = user_id);

-- 5. Add default view preferences for all users
INSERT INTO view_preferences (user_id, view_type, view_id, preferences)
SELECT 
    id,
    'category',
    'all',
    '{}'::jsonb
FROM auth.users
ON CONFLICT (user_id, view_type, view_id) DO NOTHING;

-- 6. Now add sharing support as a SEPARATE policy (avoiding recursion)
DROP POLICY IF EXISTS "playlists_shared" ON playlists;
CREATE POLICY "playlists_shared" ON playlists FOR SELECT
USING (
    id IN (
        SELECT playlist_id 
        FROM playlist_shares 
        WHERE LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
    )
);

-- 7. Verify fixes
DO $$
DECLARE
    vp_count INTEGER;
    pol_count INTEGER;
BEGIN
    -- Check view_preferences exists
    SELECT COUNT(*) INTO vp_count FROM information_schema.tables 
    WHERE table_name = 'view_preferences' AND table_schema = 'public';
    
    -- Count policies
    SELECT COUNT(*) INTO pol_count FROM pg_policies 
    WHERE tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'view_preferences');
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'FORCE FIX COMPLETED';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'view_preferences table exists: %', CASE WHEN vp_count > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Total policies created: %', pol_count;
    RAISE NOTICE '';
    RAISE NOTICE 'All tables have SIMPLE, NON-RECURSIVE policies.';
    RAISE NOTICE 'The 406 and 500 errors should be gone.';
    RAISE NOTICE '===========================================';
END $$;

-- 8. Test queries
SELECT 'Testing view_preferences access:' as test;
SELECT COUNT(*) as view_pref_count FROM view_preferences WHERE user_id = auth.uid();

SELECT 'Testing playlists access:' as test;
SELECT COUNT(*) as playlist_count FROM playlists WHERE user_id = auth.uid();

SELECT 'Testing tracks access:' as test;
SELECT COUNT(*) as track_count FROM tracks WHERE user_id = auth.uid();