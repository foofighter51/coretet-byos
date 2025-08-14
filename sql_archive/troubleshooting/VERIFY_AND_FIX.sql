-- VERIFY THE ISSUE AND APPLY TARGETED FIX

-- 1. Confirm your data exists (using direct user_id)
SELECT 
    'Your data in database:' as status,
    COUNT(*) as track_count 
FROM tracks 
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- 2. Check current policies
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists')
ORDER BY tablename;

-- 3. The issue: auth.uid() in policies vs user_id in queries
-- When your app queries with .eq('user_id', user.id), it needs to match auth.uid()

-- Let's test if auth context is the issue by creating a debug function
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS TABLE (
    current_auth_uid uuid,
    ericexley_user_id uuid,
    they_match boolean
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        auth.uid() as current_auth_uid,
        '55a58df9-3698-4973-9add-b82d76cde766'::uuid as ericexley_user_id,
        auth.uid() = '55a58df9-3698-4973-9add-b82d76cde766'::uuid as they_match
$$;

-- 4. TEMPORARY FIX: Add a bypass policy for debugging
-- This will let us verify if the app works when policies aren't blocking

-- For tracks
CREATE POLICY "temp_tracks_bypass" ON tracks
    FOR SELECT
    TO authenticated
    USING (true);  -- Temporarily allow all authenticated users to read all tracks

-- For playlists  
CREATE POLICY "temp_playlists_bypass" ON playlists
    FOR SELECT
    TO authenticated
    USING (true);  -- Temporarily allow all authenticated users to read all playlists

-- 5. NOW TEST YOUR APP - It should show all tracks/playlists in the system

-- 6. If the app now shows data, the issue is confirmed as auth context
-- Remove the temporary policies:
/*
DROP POLICY "temp_tracks_bypass" ON tracks;
DROP POLICY "temp_playlists_bypass" ON playlists;
*/

-- 7. The real fix: Ensure your app is passing auth correctly
-- In your browser console at coretet.app, run:
-- (await window.supabase.auth.getSession()).data.session?.user.id
-- This should return: 55a58df9-3698-4973-9add-b82d76cde766