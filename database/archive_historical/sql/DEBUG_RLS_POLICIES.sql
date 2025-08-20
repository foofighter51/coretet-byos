-- Debug RLS policies on tracks table

-- 1. Check what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tracks'
ORDER BY policyname;

-- 2. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables
WHERE tablename = 'tracks';

-- 3. Check total tracks in the table (bypasses RLS)
SELECT COUNT(*) as total_tracks_in_table FROM tracks;

-- 4. Check tracks for specific user (respects RLS)
SELECT COUNT(*) as visible_tracks FROM tracks;

-- 5. Get current user
SELECT auth.uid() as current_user_id, auth.email() as current_user_email;

-- 6. Check if there are tracks for the current user (bypasses RLS with security definer)
CREATE OR REPLACE FUNCTION count_user_tracks()
RETURNS TABLE(user_email text, user_id uuid, track_count bigint)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
    SELECT 
        auth.email() as user_email,
        auth.uid() as user_id,
        COUNT(*) as track_count
    FROM tracks 
    WHERE user_id = auth.uid()
$$;

SELECT * FROM count_user_tracks();

-- Drop the temp function
DROP FUNCTION IF EXISTS count_user_tracks();