-- Simple fix for playlist policies
-- Run this in Supabase SQL Editor while logged in as a database admin

-- 1. First, let's see what policies exist
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('playlists', 'playlist_tracks')
ORDER BY tablename, policyname;

-- 2. Drop ALL policies on both tables to start fresh
DO $$ 
BEGIN
    -- Drop all policies on playlists
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'playlists' AND schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlists', r.policyname);
    END LOOP;
    
    -- Drop all policies on playlist_tracks
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'playlist_tracks' AND schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON playlist_tracks', r.policyname);
    END LOOP;
END $$;

-- 3. Create simple, working policies for playlists
CREATE POLICY "Enable all for authenticated users own playlists" ON playlists
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Create simple, working policies for playlist_tracks
CREATE POLICY "Enable read for users own playlist tracks" ON playlist_tracks
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for users own playlist tracks" ON playlist_tracks
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for users own playlist tracks" ON playlist_tracks
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for users own playlist tracks" ON playlist_tracks
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- 5. Verify the policies were created
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('playlists', 'playlist_tracks')
ORDER BY tablename, policyname;