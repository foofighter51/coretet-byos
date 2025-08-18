-- RLS Diagnosis Script
-- This helps identify the exact cause of the recursion issue

-- Step 1: Check current RLS policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_roles', 'tracks')
ORDER BY tablename, policyname;

-- Step 2: Check if tables exist and their structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles')
ORDER BY table_name, ordinal_position;

-- Step 3: Check current auth.uid() value
SELECT auth.uid() as current_user_id;

-- Step 4: Test profile query directly (this is what's failing)
SELECT id, email, storage_limit, is_active 
FROM profiles 
WHERE id = '68b47b60-e826-4c4b-a433-90759f1240c8'::uuid;

-- Step 5: Test user_roles query directly
SELECT user_id, role 
FROM user_roles 
WHERE user_id = '68b47b60-e826-4c4b-a433-90759f1240c8'::uuid;

-- Step 6: Check for policy dependencies
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    p.polname as policy_name,
    p.polcmd as policy_command,
    pg_get_expr(p.polqual, p.polrelid) as policy_expression
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('profiles', 'user_roles')
ORDER BY c.relname, p.polname;