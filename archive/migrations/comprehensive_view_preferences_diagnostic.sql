-- =====================================================
-- COMPREHENSIVE VIEW_PREFERENCES DIAGNOSTIC SCRIPT
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose 406 errors

-- Clear previous diagnostic results
DROP TABLE IF EXISTS diagnostic_results CASCADE;
CREATE TEMP TABLE diagnostic_results (
    test_name TEXT,
    status TEXT,
    details TEXT
);

-- =====================================================
-- TEST 1: Check if table exists and its structure
-- =====================================================
DO $$
DECLARE
    table_exists BOOLEAN;
    column_list TEXT;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get column list
        SELECT string_agg(
            column_name || ' (' || data_type || ')', 
            ', ' ORDER BY ordinal_position
        ) INTO column_list
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences';
        
        INSERT INTO diagnostic_results VALUES 
            ('Table Existence', 'EXISTS', 'Columns: ' || column_list);
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('Table Existence', 'MISSING', 'Table view_preferences does not exist');
    END IF;
END $$;

-- =====================================================
-- TEST 2: Check for required columns (what frontend expects)
-- =====================================================
DO $$
DECLARE
    has_sort_by BOOLEAN;
    has_sort_direction BOOLEAN;
    has_view_mode BOOLEAN;
    has_manual_positions BOOLEAN;
    missing_cols TEXT := '';
BEGIN
    -- Check each required column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
        AND column_name = 'sort_by'
    ) INTO has_sort_by;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
        AND column_name = 'sort_direction'
    ) INTO has_sort_direction;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
        AND column_name = 'view_mode'
    ) INTO has_view_mode;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
        AND column_name = 'manual_positions'
    ) INTO has_manual_positions;
    
    -- Build missing columns list
    IF NOT has_sort_by THEN missing_cols := missing_cols || 'sort_by, '; END IF;
    IF NOT has_sort_direction THEN missing_cols := missing_cols || 'sort_direction, '; END IF;
    IF NOT has_view_mode THEN missing_cols := missing_cols || 'view_mode, '; END IF;
    IF NOT has_manual_positions THEN missing_cols := missing_cols || 'manual_positions, '; END IF;
    
    IF missing_cols = '' THEN
        INSERT INTO diagnostic_results VALUES 
            ('Required Columns', 'OK', 'All required columns exist');
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('Required Columns', 'ERROR', 'Missing columns: ' || rtrim(missing_cols, ', '));
    END IF;
END $$;

-- =====================================================
-- TEST 3: Check for conflicting JSONB preferences column
-- =====================================================
DO $$
DECLARE
    has_preferences_jsonb BOOLEAN;
    jsonb_type TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
        AND column_name = 'preferences'
    ) INTO has_preferences_jsonb;
    
    IF has_preferences_jsonb THEN
        SELECT data_type INTO jsonb_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
        AND column_name = 'preferences';
        
        INSERT INTO diagnostic_results VALUES 
            ('JSONB Column', 'WARNING', 
             'Found "preferences" column (' || jsonb_type || '). This conflicts with individual columns expected by frontend.');
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('JSONB Column', 'OK', 'No conflicting preferences JSONB column');
    END IF;
END $$;

-- =====================================================
-- TEST 4: Check RPC function existence
-- =====================================================
DO $$
DECLARE
    func_exists BOOLEAN;
    param_list TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'upsert_view_preference'
    ) INTO func_exists;
    
    IF func_exists THEN
        -- Get parameter names
        SELECT string_agg(
            parameter_name || ' ' || parameter_mode, 
            ', ' ORDER BY ordinal_position
        ) INTO param_list
        FROM information_schema.parameters
        WHERE specific_schema = 'public'
        AND specific_name LIKE 'upsert_view_preference%';
        
        INSERT INTO diagnostic_results VALUES 
            ('RPC Function', 'EXISTS', 'Parameters: ' || COALESCE(param_list, 'none'));
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('RPC Function', 'MISSING', 'Function upsert_view_preference does not exist');
    END IF;
END $$;

-- =====================================================
-- TEST 5: Check RLS policies
-- =====================================================
DO $$
DECLARE
    policy_count INTEGER;
    policy_list TEXT;
BEGIN
    SELECT COUNT(*), string_agg(polname, ', ')
    INTO policy_count, policy_list
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relname = 'view_preferences';
    
    IF policy_count > 0 THEN
        INSERT INTO diagnostic_results VALUES 
            ('RLS Policies', 'OK', policy_count || ' policies: ' || policy_list);
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('RLS Policies', 'WARNING', 'No RLS policies found');
    END IF;
END $$;

-- =====================================================
-- TEST 6: Simulate frontend query
-- =====================================================
DO $$
DECLARE
    test_user_id UUID;
    error_msg TEXT;
    success BOOLEAN := false;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        BEGIN
            -- Try the exact query the frontend makes
            PERFORM * FROM view_preferences 
            WHERE user_id = test_user_id
            AND view_type = 'category'
            AND view_id = 'test'
            LIMIT 1;
            
            success := true;
            INSERT INTO diagnostic_results VALUES 
                ('Frontend Query Test', 'OK', 'Query executes without errors');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            INSERT INTO diagnostic_results VALUES 
                ('Frontend Query Test', 'ERROR', 'Query failed: ' || error_msg);
        END;
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('Frontend Query Test', 'SKIP', 'No users found for testing');
    END IF;
END $$;

-- =====================================================
-- TEST 7: Check for PostgREST exposure
-- =====================================================
DO $$
DECLARE
    is_exposed BOOLEAN;
BEGIN
    -- Tables are exposed to PostgREST by default unless explicitly hidden
    -- Check if there's a comment hiding it
    SELECT NOT (obj_description('public.view_preferences'::regclass) ILIKE '%@omit%')
    INTO is_exposed;
    
    IF is_exposed THEN
        INSERT INTO diagnostic_results VALUES 
            ('PostgREST Exposure', 'OK', 'Table is exposed to PostgREST API');
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('PostgREST Exposure', 'ERROR', 'Table might be hidden from PostgREST');
    END IF;
END $$;

-- =====================================================
-- TEST 8: Check for conflicting views or functions
-- =====================================================
DO $$
DECLARE
    conflicts TEXT := '';
BEGIN
    -- Check for views with same name
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
    ) THEN
        conflicts := conflicts || 'Found VIEW with same name; ';
    END IF;
    
    -- Check for materialized views
    IF EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname = 'view_preferences'
    ) THEN
        conflicts := conflicts || 'Found MATERIALIZED VIEW with same name; ';
    END IF;
    
    IF conflicts = '' THEN
        INSERT INTO diagnostic_results VALUES 
            ('Name Conflicts', 'OK', 'No conflicting database objects');
    ELSE
        INSERT INTO diagnostic_results VALUES 
            ('Name Conflicts', 'ERROR', conflicts);
    END IF;
END $$;

-- =====================================================
-- DISPLAY RESULTS
-- =====================================================
SELECT 
    CASE 
        WHEN status IN ('OK', 'EXISTS') THEN '✅'
        WHEN status IN ('WARNING', 'SKIP') THEN '⚠️'
        ELSE '❌'
    END as icon,
    test_name,
    status,
    details
FROM diagnostic_results
ORDER BY 
    CASE status 
        WHEN 'ERROR' THEN 1
        WHEN 'MISSING' THEN 2
        WHEN 'WARNING' THEN 3
        ELSE 4
    END;

-- =====================================================
-- RECOMMENDATIONS
-- =====================================================
DO $$
DECLARE
    has_errors BOOLEAN;
    has_warnings BOOLEAN;
    recommendation TEXT := '';
BEGIN
    SELECT EXISTS(SELECT 1 FROM diagnostic_results WHERE status IN ('ERROR', 'MISSING'))
    INTO has_errors;
    
    SELECT EXISTS(SELECT 1 FROM diagnostic_results WHERE status = 'WARNING')
    INTO has_warnings;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSIS COMPLETE';
    RAISE NOTICE '========================================';
    
    IF has_errors THEN
        RAISE NOTICE '❌ CRITICAL ISSUES FOUND';
        RAISE NOTICE '';
        RAISE NOTICE 'The 406 errors are caused by schema mismatches.';
        RAISE NOTICE 'The frontend expects these exact columns:';
        RAISE NOTICE '  - sort_by (TEXT)';
        RAISE NOTICE '  - sort_direction (TEXT)';
        RAISE NOTICE '  - view_mode (TEXT)';
        RAISE NOTICE '  - manual_positions (JSONB)';
        RAISE NOTICE '';
        RAISE NOTICE 'RECOMMENDED ACTION:';
        RAISE NOTICE '1. Run the definitive_view_preferences_fix.sql script';
        RAISE NOTICE '2. Wait 60 seconds for PostgREST to refresh';
        RAISE NOTICE '3. Test the application';
    ELSIF has_warnings THEN
        RAISE NOTICE '⚠️ WARNINGS FOUND';
        RAISE NOTICE 'The table structure might be correct but has minor issues.';
        RAISE NOTICE 'Consider running the fix script to ensure everything is optimal.';
    ELSE
        RAISE NOTICE '✅ NO ISSUES FOUND';
        RAISE NOTICE 'The view_preferences table appears to be correctly configured.';
        RAISE NOTICE '';
        RAISE NOTICE 'If you still see 406 errors:';
        RAISE NOTICE '1. Clear browser cache';
        RAISE NOTICE '2. Check PostgREST logs in Supabase dashboard';
        RAISE NOTICE '3. Ensure your Supabase project is running';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Clean up
DROP TABLE IF EXISTS diagnostic_results;