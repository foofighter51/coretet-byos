-- DIAGNOSE AUTH SESSION ISSUE FOR ERICEXLEY@GMAIL.COM
-- This will help identify if the problem is authentication-related
-- without creating overly permissive policies

-- ============================================
-- STEP 1: CHECK YOUR CURRENT AUTH SESSION
-- ============================================

-- This is the most important query - it shows what user you're authenticated as
SELECT 
    auth.uid() as current_auth_uid,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED - This is the problem!'
        ELSE 'Authenticated with ID: ' || auth.uid()
    END as auth_status;

-- If authenticated, get your details
SELECT 
    u.id,
    u.email,
    ur.role,
    p.email as profile_email
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.id = auth.uid();

-- ============================================
-- STEP 2: FIND YOUR ACTUAL USER RECORD
-- ============================================

-- Get ericexley@gmail.com's user ID from the database
SELECT 
    id as your_actual_user_id,
    email,
    created_at,
    'This should match your auth.uid() above' as note
FROM auth.users
WHERE email = 'ericexley@gmail.com';

-- ============================================
-- STEP 3: CHECK FOR AUTH MISMATCH
-- ============================================

-- Compare your current auth session with your actual user ID
WITH auth_check AS (
    SELECT 
        auth.uid() as current_auth_id,
        (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') as actual_user_id
)
SELECT 
    current_auth_id,
    actual_user_id,
    CASE 
        WHEN current_auth_id IS NULL THEN 'NOT AUTHENTICATED'
        WHEN current_auth_id = actual_user_id THEN 'OK - IDs match'
        ELSE 'PROBLEM - Auth mismatch!'
    END as diagnosis,
    CASE 
        WHEN current_auth_id IS NULL THEN 'You need to log in again'
        WHEN current_auth_id != actual_user_id THEN 'You are logged in as a different user'
        ELSE 'Authentication is correct'
    END as action_needed
FROM auth_check;

-- ============================================
-- STEP 4: CHECK YOUR DATA OWNERSHIP
-- ============================================

-- Count your tracks using your actual user ID (not auth.uid())
SELECT 
    'Tracks owned by ericexley@gmail.com' as description,
    COUNT(*) as count
FROM tracks
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
UNION ALL
SELECT 
    'Playlists owned by ericexley@gmail.com',
    COUNT(*)
FROM playlists
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
UNION ALL
SELECT 
    'Tags owned by ericexley@gmail.com',
    COUNT(*)
FROM tags
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com');

-- ============================================
-- STEP 5: TEST CURRENT POLICIES
-- ============================================

-- See what tracks are visible with your current auth session
SELECT 
    'Tracks visible to current auth.uid()' as description,
    COUNT(*) as count
FROM tracks
WHERE user_id = auth.uid()
UNION ALL
SELECT 
    'Tracks that SHOULD be visible (owned by ericexley@gmail.com)',
    COUNT(*)
FROM tracks
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com');

-- ============================================
-- DIAGNOSIS SUMMARY
-- ============================================

-- This query summarizes the issue
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 
            'You are not authenticated. Solution: Log out and log back in at coretet.app'
        WHEN auth.uid() != (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com') THEN 
            'You are logged in as a different user. Solution: Log out and log back in with ericexley@gmail.com'
        WHEN NOT EXISTS (SELECT 1 FROM tracks WHERE user_id = auth.uid()) THEN 
            'Authentication is correct but no tracks found. Check if tracks were uploaded with different user_id'
        ELSE 
            'Authentication looks correct. The issue might be with the application or RLS policies'
    END as diagnosis_and_solution;

-- ============================================
-- IF YOU NEED TO SEE YOUR DATA TEMPORARILY
-- ============================================
-- Only run this section if you confirm you're not properly authenticated
-- and need to verify your data exists

/*
-- Sample of your tracks (bypassing auth check)
SELECT 
    id,
    name,
    artist,
    created_at
FROM tracks
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com')
ORDER BY created_at DESC
LIMIT 5;
*/