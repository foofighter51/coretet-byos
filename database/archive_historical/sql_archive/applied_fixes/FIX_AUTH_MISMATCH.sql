-- FIX AUTHENTICATION MISMATCH FOR ERICEXLEY@GMAIL.COM
-- This maintains strict security while fixing the visibility issue

-- ============================================
-- STEP 1: IDENTIFY THE PROBLEM
-- ============================================

-- Check if you're running this in Supabase SQL Editor without auth context
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 'Running in SQL Editor without auth - this is normal'
        ELSE 'Authenticated as: ' || auth.uid()
    END as auth_context,
    'The SQL Editor runs with service role, not as your user' as explanation;

-- Find your actual user ID
SELECT 
    id as your_user_id,
    email,
    'Save this ID for the queries below' as note
FROM auth.users
WHERE email = 'ericexley@gmail.com';

-- ============================================
-- STEP 2: VERIFY YOUR DATA EXISTS
-- ============================================

-- Replace YOUR_USER_ID with the ID from above query
-- Example: WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766'

-- Check your tracks (using direct user_id, not auth.uid())
SELECT 
    COUNT(*) as track_count,
    MIN(created_at) as first_track,
    MAX(created_at) as latest_track
FROM tracks
WHERE user_id = 'YOUR_USER_ID';  -- Replace with your actual ID

-- Check your playlists
SELECT 
    COUNT(*) as playlist_count
FROM playlists
WHERE user_id = 'YOUR_USER_ID';  -- Replace with your actual ID

-- ============================================
-- STEP 3: TEST IN YOUR APP
-- ============================================

/*
The issue is likely one of these:

1. SQL Editor Context: The Supabase SQL Editor doesn't run queries 
   with your user authentication. It uses a service role, so auth.uid() 
   returns NULL. This is why you can't see your tracks in the SQL editor.

2. App Authentication: After VS Code crashed, you may need to:
   - Clear your browser cache/cookies for coretet.app
   - Log out completely
   - Log back in with ericexley@gmail.com

3. To verify the app is working:
   - Go to coretet.app
   - Open browser developer tools (F12)
   - Go to Console
   - Run: (await supabase.auth.getUser()).data.user?.email
   - This should show 'ericexley@gmail.com'
*/

-- ============================================
-- STEP 4: EMERGENCY DATA RECOVERY (if needed)
-- ============================================

-- Only use this if you need to export your data
-- This shows your tracks without auth checks

/*
-- Export your track list
SELECT 
    id,
    name,
    artist,
    album,
    url,
    created_at
FROM tracks
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
ORDER BY created_at DESC;

-- Export your playlists
SELECT 
    p.id,
    p.name,
    p.description,
    p.created_at
FROM playlists p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
ORDER BY p.created_at DESC;
*/

-- ============================================
-- STEP 5: VERIFY RLS POLICIES ARE CORRECT
-- ============================================

-- These are the correct, secure policies that should exist
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid() - correct'
        ELSE 'Check this policy'
    END as policy_check
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'tags')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- RECOMMENDED ACTIONS:
-- ============================================
/*
1. First, try logging out and back in at coretet.app
2. Clear browser cache/cookies if needed
3. If still not working, check browser console for errors
4. The SQL Editor will never show your tracks with auth.uid() 
   because it doesn't have your auth context - this is normal
5. Your data is safe and the security policies are working correctly
*/