-- Manual fix for playlist policies - simpler approach
-- Run each section one at a time in Supabase SQL Editor

-- 1. Check what policies currently exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('playlists', 'playlist_tracks')
ORDER BY tablename, policyname;

-- 2. Drop all existing policies on playlists
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;
DROP POLICY IF EXISTS "Enable all for authenticated users own playlists" ON playlists;

-- 3. Drop all existing policies on playlist_tracks
DROP POLICY IF EXISTS "Users can view tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can view playlist tracks they have access to" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can view their playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks to their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks from their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can reorder tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can update tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Enable read for users own playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Enable insert for users own playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Enable update for users own playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Enable delete for users own playlist tracks" ON playlist_tracks;

-- 4. Create ONE simple policy for playlists (all operations)
CREATE POLICY "Users manage own playlists" ON playlists
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Create simple policies for playlist_tracks
CREATE POLICY "Users read own playlist tracks" ON playlist_tracks
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own playlist tracks" ON playlist_tracks
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users update own playlist tracks" ON playlist_tracks
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users delete own playlist tracks" ON playlist_tracks
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- 6. Verify the new policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('playlists', 'playlist_tracks')
ORDER BY tablename, policyname;