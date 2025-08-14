-- CLEAN RLS SOLUTION - STREAMLINED AND SIMPLE
-- This removes all the complexity and conflicting policies

-- =====================================================
-- STEP 1: VERIFY YOUR DATA EXISTS
-- =====================================================
-- Run this first to confirm your data is in the database
SELECT 
    'Tracks' as type, COUNT(*) as count 
FROM tracks 
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766'
UNION ALL
SELECT 
    'Playlists', COUNT(*) 
FROM playlists 
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- =====================================================
-- STEP 2: CLEAN UP ALL EXISTING POLICIES
-- =====================================================

-- Drop ALL policies on tracks table
DROP POLICY IF EXISTS "Users can read own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can read all tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view tracks in shared playlists" ON tracks;
DROP POLICY IF EXISTS "Users can view accessible tracks" ON tracks;
DROP POLICY IF EXISTS "Temporary: ericexley can view own tracks" ON tracks;
DROP POLICY IF EXISTS "temp_fix_ericexley_tracks" ON tracks;
DROP POLICY IF EXISTS "debug_ericexley_tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view tracks they have access to" ON tracks;
DROP POLICY IF EXISTS "temp_allow_ericexley_tracks" ON tracks;
DROP POLICY IF EXISTS "select_own_tracks" ON tracks;

-- Drop ALL policies on playlists table
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view playlists shared with them" ON playlists;
DROP POLICY IF EXISTS "Enable all for authenticated users own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can select own or shared playlists" ON playlists;
DROP POLICY IF EXISTS "Users can manage own playlists" ON playlists;
DROP POLICY IF EXISTS "temp_allow_ericexley_playlists" ON playlists;
DROP POLICY IF EXISTS "select_own_playlists" ON playlists;

-- =====================================================
-- STEP 3: CREATE SIMPLE, CLEAR POLICIES
-- =====================================================

-- TRACKS: Users can only see and manage their own tracks
CREATE POLICY "tracks_owner_all" ON tracks
    FOR ALL 
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- PLAYLISTS: Users can only see and manage their own playlists
CREATE POLICY "playlists_owner_all" ON playlists
    FOR ALL 
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 4: VERIFY THE POLICIES
-- =====================================================

-- Check we have exactly one policy per table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 5: TEST THE QUERIES
-- =====================================================

-- These should now work without 500 errors
SELECT COUNT(*) as your_tracks FROM tracks WHERE user_id = auth.uid();
SELECT COUNT(*) as your_playlists FROM playlists WHERE user_id = auth.uid();

-- =====================================================
-- STEP 6: FUTURE SHARING IMPLEMENTATION
-- =====================================================

/*
For sharing playlists with collaborators in the future:

1. Keep the simple owner policies above
2. Create a VIEW for shared content:

CREATE VIEW shared_tracks AS
SELECT t.* 
FROM tracks t
JOIN playlist_tracks pt ON t.id = pt.track_id
JOIN playlists p ON p.id = pt.playlist_id
JOIN playlist_shares ps ON ps.playlist_id = p.id
WHERE ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
AND ps.status = 'active';

3. Grant SELECT on the view:
GRANT SELECT ON shared_tracks TO authenticated;

This keeps RLS policies simple and moves complex logic to views.
*/

-- =====================================================
-- DONE! Your app should now work properly.
-- =====================================================