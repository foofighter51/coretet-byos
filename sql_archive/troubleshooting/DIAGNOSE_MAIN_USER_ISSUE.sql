-- COMPREHENSIVE DIAGNOSIS FOR ERICEXLEY@GMAIL.COM VISIBILITY ISSUES
-- Run each section in order in Supabase SQL Editor

-- ============================================
-- SECTION 1: USER AUTHENTICATION STATUS
-- ============================================

-- 1.1 Check your current auth session
SELECT 
    auth.uid() as current_auth_uid,
    u.email as auth_email,
    u.id as user_id,
    ur.role as user_role,
    p.email as profile_email
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.id = auth.uid();

-- 1.2 Find ericexley@gmail.com user ID specifically
SELECT 
    u.id as user_id,
    u.email,
    ur.role,
    p.email as profile_email,
    p.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'ericexley@gmail.com';

-- ============================================
-- SECTION 2: TRACK VISIBILITY DIAGNOSIS
-- ============================================

-- 2.1 Count tracks by ownership
SELECT 
    'Total tracks in system' as metric,
    COUNT(*) as count
FROM tracks
UNION ALL
SELECT 
    'Tracks owned by ericexley@gmail.com',
    COUNT(*)
FROM tracks
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
UNION ALL
SELECT 
    'Tracks visible to current auth.uid()',
    COUNT(*)
FROM tracks
WHERE user_id = auth.uid();

-- 2.2 Sample of your tracks (should see these)
SELECT 
    t.id,
    t.name,
    t.user_id,
    t.visibility,
    t.created_at,
    CASE 
        WHEN t.user_id = auth.uid() THEN 'VISIBLE - Your track'
        WHEN t.user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') THEN 'SHOULD BE VISIBLE - Your track but different ID'
        ELSE 'Other user track'
    END as visibility_status
FROM tracks t
WHERE t.user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
ORDER BY t.created_at DESC
LIMIT 5;

-- ============================================
-- SECTION 3: RLS POLICY ANALYSIS
-- ============================================

-- 3.1 Check RLS status on all relevant tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED - SECURITY RISK!'
    END as status
FROM pg_tables 
WHERE tablename IN ('tracks', 'playlists', 'tags', 'playlist_tracks', 'playlist_shares')
ORDER BY tablename;

-- 3.2 Analyze tracks table policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual as policy_condition
FROM pg_policies
WHERE tablename = 'tracks'
ORDER BY policyname;

-- ============================================
-- SECTION 4: PLAYLIST VISIBILITY
-- ============================================

-- 4.1 Check your playlists
SELECT 
    COUNT(*) as total_playlists,
    COUNT(CASE WHEN user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') THEN 1 END) as your_playlists,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as visible_to_current_auth
FROM playlists;

-- 4.2 Sample of your playlists
SELECT 
    pl.id,
    pl.name,
    pl.user_id,
    pl.visibility,
    CASE 
        WHEN pl.user_id = auth.uid() THEN 'VISIBLE'
        WHEN pl.user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') THEN 'SHOULD BE VISIBLE'
        ELSE 'Not yours'
    END as status
FROM playlists pl
WHERE pl.user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
LIMIT 5;

-- ============================================
-- SECTION 5: AUTH ID MISMATCH CHECK
-- ============================================

-- 5.1 Critical: Check if auth.uid() matches your expected user ID
SELECT 
    auth.uid() as current_auth_uid,
    (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') as ericexley_user_id,
    auth.uid() = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') as ids_match,
    CASE 
        WHEN auth.uid() = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') THEN 'OK - IDs match'
        ELSE 'PROBLEM - Auth mismatch! You might be logged in with a different account'
    END as diagnosis;

-- ============================================
-- SECTION 6: EMERGENCY FIXES
-- ============================================

-- 6.1 If you're not an admin, make yourself one
-- UNCOMMENT AND RUN if needed:
/*
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'ericexley@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
*/

-- 6.2 If there's an auth mismatch, this temporary view can help
-- UNCOMMENT AND RUN if auth.uid() doesn't match your user_id:
/*
-- Create a temporary policy to allow you to see your own tracks
CREATE POLICY "temp_fix_ericexley_tracks" ON tracks
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
    AND auth.uid() IS NOT NULL
);
*/