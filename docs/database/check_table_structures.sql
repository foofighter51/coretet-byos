-- SQL queries to check the structure of tables causing migration errors
-- Run these queries in your Supabase SQL Editor to identify column mismatches

-- 1. Check auth_debug_log table structure
SELECT 
    'auth_debug_log' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'auth_debug_log' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check task_categories table structure  
SELECT 
    'task_categories' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_categories' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check profiles table structure
SELECT 
    'profiles' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if tables exist at all
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('auth_debug_log', 'task_categories', 'profiles')
    AND table_schema = 'public'
ORDER BY table_name;

-- 5. Alternative check using PostgreSQL system catalogs
-- This might work if information_schema is restricted
SELECT 
    t.table_name,
    c.column_name,
    c.data_type
FROM (
    SELECT 'auth_debug_log' as table_name
    UNION ALL
    SELECT 'task_categories'
    UNION ALL 
    SELECT 'profiles'
) t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
    AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 6. Check for any user_id columns specifically
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'user_id' 
    AND table_schema = 'public'
    AND table_name IN ('auth_debug_log', 'task_categories', 'profiles')
ORDER BY table_name;

-- 7. Describe tables using PostgreSQL \d equivalent
-- Note: This uses pg_class and pg_attribute which might have different permissions
SELECT 
    c.relname as table_name,
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull as not_null
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
WHERE c.relname IN ('auth_debug_log', 'task_categories', 'profiles')
    AND a.attnum > 0 
    AND NOT a.attisdropped
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.relname, a.attnum;