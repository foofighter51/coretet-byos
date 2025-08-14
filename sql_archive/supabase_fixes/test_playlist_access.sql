-- Test queries to debug playlist access issues

-- 1. Check if user has any playlists
SELECT id, name, user_id, created_at 
FROM playlists 
WHERE user_id = auth.uid();

-- 2. Check what policies exist on playlist_tracks
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'playlist_tracks';

-- 3. Try to directly query playlist_tracks for your playlists
SELECT pt.*, p.name as playlist_name 
FROM playlist_tracks pt
JOIN playlists p ON p.id = pt.playlist_id
WHERE p.user_id = auth.uid();

-- 4. Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('playlists', 'playlist_tracks');

-- 5. Check current user
SELECT auth.uid() as current_user_id, 
       (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;