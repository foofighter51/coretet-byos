-- DIAGNOSTIC SCRIPT - NO AUTH REQUIRED
-- Run this in Supabase SQL Editor (which has admin access)

-- =====================================================
-- 1. CHECK WHAT POLICIES EXIST
-- =====================================================
SELECT '=== CURRENT POLICIES ===' as section;

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', E'\n  ') as policies
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'user_track_ratings', 'track_ratings')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 2. CHECK IF TABLES HAVE DATA
-- =====================================================
SELECT '=== DATA EXISTS CHECK ===' as section;

-- Using admin access to bypass RLS
SELECT 
    'tracks' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT user_id) as unique_users,
    CASE WHEN COUNT(*) > 0 THEN 'Has data' ELSE 'Empty' END as status
FROM tracks
UNION ALL
SELECT 
    'playlists',
    COUNT(*),
    COUNT(DISTINCT user_id),
    CASE WHEN COUNT(*) > 0 THEN 'Has data' ELSE 'Empty' END
FROM playlists
UNION ALL
SELECT 
    'playlist_shares',
    COUNT(*),
    COUNT(DISTINCT shared_by),
    CASE WHEN COUNT(*) > 0 THEN 'Has data' ELSE 'Empty' END
FROM playlist_shares
UNION ALL
SELECT 
    'user_track_ratings',
    COUNT(*),
    COUNT(DISTINCT user_id),
    CASE WHEN COUNT(*) > 0 THEN 'Has data' ELSE 'Empty' END
FROM user_track_ratings;

-- =====================================================
-- 3. CHECK RLS STATUS
-- =====================================================
SELECT '=== RLS STATUS ===' as section;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'user_track_ratings', 'track_ratings')
ORDER BY tablename;

-- =====================================================
-- 4. EXAMINE POLICY DETAILS
-- =====================================================
SELECT '=== POLICY DETAILS FOR TRACKS ===' as section;

-- Show the actual policy definitions
SELECT 
    policyname,
    cmd,
    substring(qual::text, 1, 200) as using_clause_preview,
    substring(with_check::text, 1, 200) as check_clause_preview
FROM pg_policies
WHERE tablename = 'tracks'
ORDER BY policyname;

-- =====================================================
-- 5. CHECK FOR ANON ACCESS
-- =====================================================
SELECT '=== ANONYMOUS ACCESS CHECK ===' as section;

-- Check if any policies allow anonymous access
SELECT 
    tablename,
    policyname,
    roles
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
AND 'anon' = ANY(roles);

-- =====================================================
-- 6. IDENTIFY THE PROBLEM
-- =====================================================
SELECT '=== PROBLEM IDENTIFICATION ===' as section;

WITH policy_analysis AS (
    SELECT 
        tablename,
        COUNT(*) as total_policies,
        COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
        COUNT(*) FILTER (WHERE 'authenticated' = ANY(roles)) as auth_required_policies,
        COUNT(*) FILTER (WHERE 'anon' = ANY(roles)) as anon_allowed_policies
    FROM pg_policies
    WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
    GROUP BY tablename
)
SELECT 
    tablename,
    total_policies,
    select_policies,
    auth_required_policies,
    CASE 
        WHEN anon_allowed_policies = 0 AND auth_required_policies > 0 
        THEN 'REQUIRES AUTH - This is why app fails without auth token!'
        ELSE 'Some anonymous access allowed'
    END as diagnosis
FROM policy_analysis
ORDER BY tablename;

-- =====================================================
-- 7. RECOMMENDED FIX
-- =====================================================
SELECT '=== RECOMMENDED ACTIONS ===' as section;

SELECT 
    E'The app is failing because:\n' ||
    E'1. The client is not sending authentication headers\n' ||
    E'2. All policies require "authenticated" role\n' ||
    E'3. Without auth token, all queries fail\n\n' ||
    E'Options to fix:\n' ||
    E'A. Fix the client authentication (recommended)\n' ||
    E'B. Temporarily allow anonymous access (not recommended)\n' ||
    E'C. Apply emergency owner-only policies first' as diagnosis;

-- =====================================================
-- 8. CHECK SUPABASE AUTH SETTINGS
-- =====================================================
SELECT '=== CHECK AUTH PROVIDERS ===' as section;

-- Check if there are any users in the system
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
    COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as recent_users
FROM auth.users;

-- =====================================================
-- 9. EMERGENCY FIX PREVIEW
-- =====================================================
SELECT '=== EMERGENCY FIX AVAILABLE ===' as section;

SELECT 
    'Run EMERGENCY_FIX_ACCESS.sql to:' as action,
    '- Drop complex sharing policies' as step1,
    '- Apply simple owner-only policies' as step2,
    '- Restore basic functionality' as step3,
    'Then fix client authentication issue' as step4;