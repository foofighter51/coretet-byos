-- Debug signup issues with comprehensive logging
-- Run this in Supabase SQL editor to diagnose the issue

-- 1. First, check if the auth_debug_log table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'auth_debug_log'
) as debug_table_exists;

-- 2. Check recent entries if table exists
SELECT * FROM auth_debug_log 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 3. Check current auth triggers
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as is_enabled,
  CASE 
    WHEN tgtype = 7 THEN 'AFTER INSERT'
    WHEN tgtype = 19 THEN 'AFTER INSERT OR UPDATE'
    ELSE 'OTHER'
  END as trigger_type
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- 4. Check if profiles table has proper constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles'
ORDER BY tc.constraint_type;

-- 5. Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Test creating a profile directly
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'direct_test_' || extract(epoch from now())::text || '@example.com';
BEGIN
  -- Try direct insert
  INSERT INTO profiles (id, email, created_at, storage_limit, storage_used, is_active)
  VALUES (test_id, test_email, NOW(), 1073741824, 0, true);
  
  RAISE NOTICE 'SUCCESS: Direct profile creation worked';
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: Direct profile creation - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- 7. Check if there are any check constraints or defaults that might cause issues
SELECT 
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  cc.check_clause
FROM information_schema.columns c
LEFT JOIN information_schema.check_constraints cc 
  ON cc.constraint_name = c.column_name
WHERE c.table_name = 'profiles'
ORDER BY c.ordinal_position;

-- 8. Check invites table structure and constraints
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invites'
ORDER BY ordinal_position;

-- Check the code_format constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'invites'::regclass
AND contype = 'c';

-- 9. Check if there are any active invites
SELECT 
  code,
  created_by,
  used_by,
  expires_at,
  CASE 
    WHEN used_by IS NOT NULL THEN 'USED'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as status
FROM invites
ORDER BY created_at DESC
LIMIT 10;

-- 10. First check what format existing invite codes use
SELECT DISTINCT 
  code,
  length(code) as code_length,
  CASE 
    WHEN code ~ '^[A-Z0-9]+$' THEN 'UPPERCASE_ALPHANUMERIC'
    WHEN code ~ '^[a-z0-9]+$' THEN 'LOWERCASE_ALPHANUMERIC'
    WHEN code ~ '^[A-Za-z0-9]+$' THEN 'MIXED_ALPHANUMERIC'
    ELSE 'OTHER_FORMAT'
  END as format_type
FROM invites
LIMIT 5;

-- 11. Create a test invite for debugging (uppercase alphanumeric)
INSERT INTO invites (code, created_by, expires_at)
VALUES (UPPER(substr(md5(random()::text), 1, 8)), 
        (SELECT id FROM profiles WHERE email = 'ericexley@gmail.com' LIMIT 1),
        NOW() + INTERVAL '7 days')
RETURNING code as "Test invite code - use this for testing";