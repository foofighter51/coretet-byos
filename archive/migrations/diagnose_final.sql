-- DIAGNOSIS SCRIPT: Compatible with Supabase PostgreSQL
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
-- 3. CHECK RLS STATUS (simplified for Supabase)
-- ========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'playlist_tracks', 'view_preferences')
ORDER BY tablename;

-- ========================================
-- 4. CHECK FOR DUPLICATE OR CONFLICTING POLICIES
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
-- 5. SHOW FULL POLICY DEFINITIONS FOR PLAYLISTS
-- ========================================
-- Since playlists has the recursion issue, let's see the full policies
SELECT 
    policyname,
    cmd as operation,
    qual::text as full_condition
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'playlists'
ORDER BY policyname;

-- ========================================
-- 6. SHOW FULL POLICY DEFINITIONS FOR PLAYLIST_SHARES
-- ========================================
SELECT 
    policyname,
    cmd as operation,
    qual::text as full_condition
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'playlist_shares'
ORDER BY policyname;

-- ========================================
-- 7. CHECK VIEW_PREFERENCES TABLE
-- ========================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'view_preferences' AND table_schema = 'public')
        THEN 'VIEW_PREFERENCES TABLE EXISTS'
        ELSE 'VIEW_PREFERENCES TABLE IS MISSING - THIS CAUSES 406 ERRORS!'
    END as status;

-- Check columns if table exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'view_preferences'
ORDER BY ordinal_position;

-- ========================================
-- 8. CHECK PERMISSIONS ON VIEW_PREFERENCES
-- ========================================
SELECT 
    grantee,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND table_name = 'view_preferences'
GROUP BY grantee
ORDER BY grantee;

-- ========================================
-- 9. TEST DIRECT QUERY ON PLAYLISTS
-- ========================================
DO $$
DECLARE
    error_msg TEXT;
    error_detail TEXT;
    playlist_count INTEGER;
BEGIN
    BEGIN
        -- Try to count playlists for the test user
        SELECT COUNT(*) INTO playlist_count
        FROM playlists
        WHERE user_id = '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f';
        
        RAISE NOTICE 'Direct playlist query SUCCESS: Found % playlists', playlist_count;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS 
            error_msg = MESSAGE_TEXT,
            error_detail = PG_EXCEPTION_DETAIL;
        RAISE NOTICE 'Direct playlist query FAILED: %', error_msg;
        IF error_detail IS NOT NULL THEN
            RAISE NOTICE 'Error detail: %', error_detail;
        END IF;
    END;
END $$;

-- ========================================
-- 10. IDENTIFY CIRCULAR REFERENCES
-- ========================================
WITH policy_refs AS (
    SELECT 
        p1.tablename as from_table,
        p1.policyname,
        CASE 
            WHEN p1.qual::text LIKE '%playlist_shares%' AND p1.tablename != 'playlist_shares' 
                THEN 'playlist_shares'
            WHEN p1.qual::text LIKE '% playlists %' AND p1.tablename != 'playlists' 
                THEN 'playlists'
            WHEN p1.qual::text LIKE '%profiles%' AND p1.tablename != 'profiles' 
                THEN 'profiles'
            ELSE NULL
        END as references_table
    FROM pg_policies p1
    WHERE p1.schemaname = 'public'
        AND p1.tablename IN ('playlists', 'playlist_shares', 'profiles')
)
SELECT 
    from_table,
    policyname,
    references_table,
    CASE 
        WHEN from_table = 'playlists' AND references_table = 'playlist_shares' THEN '⚠️ POTENTIAL RECURSION'
        WHEN from_table = 'playlist_shares' AND references_table = 'playlists' THEN '⚠️ POTENTIAL RECURSION'
        ELSE 'OK'
    END as status
FROM policy_refs
WHERE references_table IS NOT NULL
ORDER BY from_table, policyname;

-- ========================================
-- FINAL SUMMARY
-- ========================================
DO $$
DECLARE
    vp_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if view_preferences exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'view_preferences' 
        AND table_schema = 'public'
    ) INTO vp_exists;
    
    -- Count problematic policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'playlists';
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'DIAGNOSIS SUMMARY';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'view_preferences table exists: %', CASE WHEN vp_exists THEN 'YES' ELSE 'NO (406 ERROR CAUSE)' END;
    RAISE NOTICE 'Number of policies on playlists: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Check the output above for:';
    RAISE NOTICE '1. Missing view_preferences = 406 errors';
    RAISE NOTICE '2. Circular references = 500 errors';
    RAISE NOTICE '3. Multiple policies on same table = potential conflicts';
    RAISE NOTICE '===========================================';
END $$;