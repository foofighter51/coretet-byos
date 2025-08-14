-- Comprehensive check for all auth-related issues

-- 1. Check ALL triggers on auth.users (not just our custom ones)
SELECT 
  n.nspname as schema_name,
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgenabled as is_enabled,
  t.tgtype as trigger_type
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE t.tgrelid = 'auth.users'::regclass
ORDER BY t.tgname;

-- 2. Check if there are any other functions that might be triggered
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%user%' 
  AND n.nspname IN ('public', 'auth')
  AND p.proname NOT IN ('current_user', 'session_user');

-- 3. Check for any policies on auth.users that might block insertion
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
WHERE schemaname = 'auth' AND tablename = 'users';

-- 4. Check if the profiles table has any constraints beyond foreign keys
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
ORDER BY contype, conname;

-- 5. Try to insert a test user directly into auth.users (this will likely fail but show the error)
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- This will probably fail, but we want to see why
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    instance_id,
    aud,
    role
  )
  VALUES (
    test_id,
    'direct_test_' || extract(epoch from now())::text || '@example.com',
    crypt('testpassword', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  );
  
  RAISE NOTICE 'Direct auth.users insert succeeded!';
  
  -- Clean up
  DELETE FROM auth.users WHERE id = test_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Direct auth.users insert failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- 6. Check if there are any event triggers
SELECT 
  evtname as trigger_name,
  evtevent as event,
  evtowner::regrole as owner,
  evtenabled as is_enabled
FROM pg_event_trigger;

-- 7. List all functions in the public schema that might be related
SELECT 
  proname as function_name,
  pronargs as num_args,
  prorettype::regtype as return_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname LIKE '%user%'
ORDER BY proname;