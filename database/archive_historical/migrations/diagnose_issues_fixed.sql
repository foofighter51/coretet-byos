-- DIAGNOSIS SCRIPT: Let's understand what's happening before making changes
-- Run each section separately to gather information

-- ========================================
-- 1. CHECK CURRENT POLICIES
-- ========================================
SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles,
    LEFT(qual::text, 100) as policy_condition
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'playlist_tracks', 'view_preferences')
ORDER BY tablename, policyname;

-- ========================================
-- 2. CHECK IF TABLES EXIST
-- ========================================
SELECT 
    required.table_name,
    CASE 
        WHEN ist.table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES 
        ('playlists'),
        ('playlist_shares'),
        ('profiles'),
        ('tracks'),
        ('playlist_tracks'),
        ('view_preferences')
) AS required(table_name)
LEFT JOIN information_schema.tables ist 
    ON ist.table_name = required.table_name 
    AND ist.table_schema = 'public'
ORDER BY required.table_name;

-- ========================================
-- 3. CHECK RLS STATUS
-- ========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'playlist_tracks', 'view_preferences')
ORDER BY tablename;

-- ========================================
-- 4. IDENTIFY PROBLEMATIC POLICIES (looking for recursion)
-- ========================================
-- Check for policies that reference other tables
SELECT 
    p1.tablename as table_with_policy,
    p1.policyname,
    p1.cmd as operation,
    CASE 
        WHEN p1.qual::text LIKE '%playlist_shares%' THEN 'References playlist_shares'
        WHEN p1.qual::text LIKE '%playlists%' THEN 'References playlists'
        WHEN p1.qual::text LIKE '%profiles%' THEN 'References profiles'
        WHEN p1.qual::text LIKE '%tracks%' THEN 'References tracks'
        ELSE 'No cross-references'
    END as cross_reference
FROM pg_policies p1
WHERE p1.schemaname = 'public'
    AND p1.tablename IN ('playlists', 'playlist_shares')
    AND (p1.qual::text LIKE '%playlist_shares%' 
         OR p1.qual::text LIKE '%playlists%')
ORDER BY p1.tablename, p1.policyname;

-- ========================================
-- 5. CHECK VIEW_PREFERENCES TABLE STRUCTURE (if it exists)
-- ========================================
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'VIEW_PREFERENCES EXISTS with columns:'
        ELSE 'VIEW_PREFERENCES DOES NOT EXIST'
    END as info,
    COALESCE(string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position), 'N/A') as columns
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'view_preferences';

-- ========================================
-- 6. CHECK PERMISSIONS ON VIEW_PREFERENCES
-- ========================================
SELECT 
    COALESCE(grantee, 'NO PERMISSIONS FOUND') as grantee,
    COALESCE(privilege_type, 'N/A') as privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND table_name = 'view_preferences'
UNION ALL
SELECT 'NO PERMISSIONS FOUND', 'Table might not exist'
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_privileges
    WHERE table_schema = 'public' AND table_name = 'view_preferences'
)
ORDER BY grantee, privilege_type;

-- ========================================
-- 7. TEST DIRECT QUERIES (to isolate the issue)
-- ========================================
-- Test if we can query playlists without RLS
DO $$
DECLARE
    error_msg TEXT;
    playlist_count INTEGER;
BEGIN
    BEGIN
        -- Try to count playlists for a specific user
        SELECT COUNT(*) INTO playlist_count
        FROM playlists
        WHERE user_id = '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f';
        
        RAISE NOTICE 'Direct query SUCCESS: Found % playlists', playlist_count;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE 'Direct query FAILED: %', error_msg;
    END;
END $$;

-- ========================================
-- 8. CHECK FOR DUPLICATE OR CONFLICTING POLICIES
-- ========================================
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || '(' || cmd || ')', ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'playlist_tracks', 'view_preferences')
GROUP BY tablename
ORDER BY tablename;

-- ========================================
-- 9. SHOW FULL POLICY DEFINITIONS FOR PLAYLISTS
-- ========================================
-- Since playlists has the recursion issue, let's see the full policy
SELECT 
    'PLAYLISTS POLICIES:' as table_info,
    policyname,
    cmd,
    qual::text as full_condition
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'playlists'
ORDER BY policyname;

-- ========================================
-- SUMMARY
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'DIAGNOSIS COMPLETE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Review the output above to identify:';
    RAISE NOTICE '1. Which policies exist and their conditions';
    RAISE NOTICE '2. Whether view_preferences table exists';
    RAISE NOTICE '3. Which tables have RLS enabled';
    RAISE NOTICE '4. Any circular references in policies';
    RAISE NOTICE '5. Permission issues';
    RAISE NOTICE '';
    RAISE NOTICE 'The key issues to look for:';
    RAISE NOTICE '- view_preferences table missing = 406 errors';
    RAISE NOTICE '- Circular policy references = 500 errors';
    RAISE NOTICE '===========================================';
END $$;