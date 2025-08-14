-- STEP 3: SIMPLE RLS POLICIES
-- These policies are simple, clear, and actually work

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- 2. Profiles - users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- 3. Tracks - users can only see and manage their own tracks
CREATE POLICY "Users can view own tracks" ON tracks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tracks" ON tracks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tracks" ON tracks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tracks" ON tracks
    FOR DELETE USING (user_id = auth.uid());

-- 4. Playlists - users can only see and manage their own playlists
CREATE POLICY "Users can view own playlists" ON playlists
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own playlists" ON playlists
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own playlists" ON playlists
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own playlists" ON playlists
    FOR DELETE USING (user_id = auth.uid());

-- 5. Playlist tracks - users can only manage tracks in their own playlists
CREATE POLICY "Users can view own playlist tracks" ON playlist_tracks
    FOR SELECT USING (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own playlist tracks" ON playlist_tracks
    FOR INSERT WITH CHECK (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own playlist tracks" ON playlist_tracks
    FOR UPDATE USING (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own playlist tracks" ON playlist_tracks
    FOR DELETE USING (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );

-- 6. Test the policies
SELECT COUNT(*) as your_tracks FROM tracks;
SELECT COUNT(*) as your_playlists FROM playlists;

SELECT '✅ Simple RLS policies created - no recursion, no complexity!' as status;