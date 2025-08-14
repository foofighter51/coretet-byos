-- Diagnostic script to check view_preferences table
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check if table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'view_preferences'
) as table_exists;

-- 2. Show all columns in the table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'view_preferences'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'view_preferences';

-- 4. Check all policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'view_preferences';

-- 5. Check if the RPC function exists
SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'upsert_view_preference'
) as function_exists;

-- 6. Try a test query as the API would
DO $$
DECLARE
    test_result record;
BEGIN
    -- Try to select from view_preferences
    BEGIN
        SELECT * INTO test_result
        FROM view_preferences
        WHERE view_type = 'category'
        AND view_id = 'all'
        LIMIT 1;
        
        RAISE NOTICE 'Query succeeded';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Query failed: %', SQLERRM;
    END;
END $$;

-- 7. Check if there's a view or other object with the same name
SELECT 
    n.nspname as schema_name,
    c.relname as object_name,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
        WHEN 'i' THEN 'index'
        WHEN 'S' THEN 'sequence'
        WHEN 'f' THEN 'foreign table'
        ELSE 'other'
    END as object_type
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'view_preferences'
ORDER BY 1,2;