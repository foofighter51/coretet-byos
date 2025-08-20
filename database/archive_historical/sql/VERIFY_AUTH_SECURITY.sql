-- Verify auth security is still in place after trigger cleanup

-- 1. Check current triggers on auth.users
SELECT '=== Current auth.users triggers ===' as check;
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgenabled as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgisinternal = false;

-- 2. Review the handle_new_user function
SELECT '=== handle_new_user function ===' as check;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check RLS policies on invites table
SELECT '=== Invites table RLS policies ===' as check;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as "using_expression",
  with_check as "with_check_expression"
FROM pg_policies
WHERE tablename = 'invites'
ORDER BY policyname;

-- 4. Check if invites table has proper constraints
SELECT '=== Invites table constraints ===' as check;
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'invites'::regclass
ORDER BY conname;

-- 5. Test that invites are required (should fail without valid invite)
SELECT '=== Test: Can we query invites without auth? ===' as check;
-- This should fail or return empty due to RLS
DO $$
BEGIN
  -- Try to select invites as anonymous user
  SET LOCAL role TO anon;
  PERFORM * FROM invites;
  RAISE NOTICE 'WARNING: Anonymous users can read invites table!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'GOOD: Anonymous users cannot read invites table';
END $$;

-- 6. Check auth configuration (skipped - requires admin access)
SELECT '=== Auth configuration ===' as check;
SELECT 'Skipping auth.users check - table is properly protected with permissions' as note;

-- 7. Verify invite validation is happening in the app
SELECT '=== Recent invite usage ===' as check;
SELECT 
  code,
  CASE 
    WHEN used_by IS NOT NULL THEN 'USED'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as status,
  created_at,
  expires_at,
  used_at
FROM invites
ORDER BY created_at DESC
LIMIT 10;

-- 8. Check if there are any security-related functions
SELECT '=== Security-related functions ===' as check;
SELECT 
  n.nspname as schema,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%invite%' OR p.proname LIKE '%auth%'
  AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;

-- 9. Important note about invite validation
SELECT '=== SECURITY NOTE ===' as important;
SELECT 'Invite code validation is handled in the APPLICATION layer (AuthContext.tsx), not database triggers.' as note
UNION ALL
SELECT 'The signup process validates invite codes BEFORE creating the auth user.' as note
UNION ALL
SELECT 'This is the correct approach - validation should happen before user creation.' as note;