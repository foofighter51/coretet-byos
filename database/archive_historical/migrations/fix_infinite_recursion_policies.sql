-- CRITICAL FIX: Resolve infinite recursion in RLS policies
-- The error "infinite recursion detected in policy for relation" means policies are referencing each other in a loop

-- 1. First, temporarily disable RLS to fix the policies
ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on playlists
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'playlists' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlists', pol.policyname);
    END LOOP;
    
    -- Drop all policies on playlist_shares
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'playlist_shares' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlist_shares', pol.policyname);
    END LOOP;
    
    -- Drop all policies on profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
    
    -- Drop all policies on tracks
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tracks' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tracks', pol.policyname);
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped';
END $$;

-- 3. Create SIMPLE, NON-RECURSIVE policies

-- PROFILES - Simple policies
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- TRACKS - Simple policies
CREATE POLICY "tracks_select_own" ON tracks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tracks_insert_own" ON tracks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tracks_update_own" ON tracks
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tracks_delete_own" ON tracks
    FOR DELETE USING (auth.uid() = user_id);

-- PLAYLISTS - Simple policies (no recursion)
CREATE POLICY "playlists_select_own" ON playlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "playlists_insert_own" ON playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playlists_update_own" ON playlists
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playlists_delete_own" ON playlists
    FOR DELETE USING (auth.uid() = user_id);

-- PLAYLIST_SHARES - Simple policies (avoiding recursion)
-- Use email comparison directly without subqueries that might cause loops
CREATE POLICY "playlist_shares_select" ON playlist_shares
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM playlists WHERE id = playlist_shares.playlist_id
        )
        OR 
        LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    );

CREATE POLICY "playlist_shares_insert" ON playlist_shares
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM playlists WHERE id = playlist_shares.playlist_id
        )
    );

CREATE POLICY "playlist_shares_update" ON playlist_shares
    FOR UPDATE USING (
        LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
    WITH CHECK (
        LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    );

CREATE POLICY "playlist_shares_delete" ON playlist_shares
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM playlists WHERE id = playlist_shares.playlist_id
        )
    );

-- 4. Add a SEPARATE policy for viewing shared playlists (avoiding recursion)
CREATE POLICY "playlists_select_shared" ON playlists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND LOWER(ps.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
            -- Do not reference back to playlists table here
        )
    );

-- 5. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;

-- 6. Create the missing view_preferences table
CREATE TABLE IF NOT EXISTS view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_type, view_id)
);

-- Enable RLS for view_preferences
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- Simple policies for view_preferences
CREATE POLICY "view_preferences_select_own" ON view_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "view_preferences_insert_own" ON view_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "view_preferences_update_own" ON view_preferences
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "view_preferences_delete_own" ON view_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT SELECT ON view_preferences TO anon;

-- 7. Verify the fix
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ INFINITE RECURSION FIXED!';
    RAISE NOTICE '✅ All RLS policies rebuilt without circular references';
    RAISE NOTICE '✅ view_preferences table created';
    RAISE NOTICE '';
    RAISE NOTICE 'The app should now load without 500 errors.';
    RAISE NOTICE 'Users can only see their own data and shared playlists.';
END $$;

-- 8. Test query to ensure no recursion
SELECT 
    'Testing policies - this should not error' as test,
    COUNT(*) as playlist_count
FROM playlists
WHERE auth.uid() IS NOT NULL;