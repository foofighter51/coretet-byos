-- FINAL DIAGNOSTIC - RUN IN SUPABASE SQL EDITOR

-- 1. Check if RLS is enabled (it should be)
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tracks', 'playlists', 'tags');

-- 2. List ALL current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'tags')
ORDER BY tablename, policyname;

-- 3. Test a simple query as service role (what SQL Editor uses)
-- This should return your data
SELECT COUNT(*) as tracks_as_service_role
FROM tracks
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- 4. Check if there are any error logs
-- Look for recent errors in your Supabase dashboard under Logs > Postgres Logs

-- 5. Test the exact query your app is making
-- This simulates what happens when your app queries with auth context
SET LOCAL "request.jwt.claims" TO '{"sub":"55a58df9-3698-4973-9add-b82d76cde766"}';
SELECT COUNT(*) as tracks_with_auth_context FROM tracks;
RESET "request.jwt.claims";

-- 6. If all else fails, temporarily disable RLS to test
-- WARNING: Only do this briefly for testing!
/*
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;

-- Test your app now - if it works, RLS policies are the issue
-- Then immediately re-enable:

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
*/