-- Step-by-step debugging for signup 500 error

-- STEP 1: Check what triggers currently exist on auth.users
SELECT '=== STEP 1: Current auth.users triggers ===' as step;
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- STEP 2: Check if auth_debug_log table exists and has any entries
SELECT '=== STEP 2: Debug log entries ===' as step;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'auth_debug_log'
) as debug_log_exists;

-- If it exists, show recent entries
SELECT * FROM auth_debug_log 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 10;

-- STEP 3: Test the trigger function manually
SELECT '=== STEP 3: Test trigger function ===' as step;
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Call the function with test data
  PERFORM handle_new_user();
  test_result := 'Function exists and can be called';
EXCEPTION
  WHEN OTHERS THEN
    test_result := 'Function error: ' || SQLERRM;
END $$;

-- STEP 4: Check Supabase auth configuration
SELECT '=== STEP 4: Check auth configuration ===' as step;
-- Check if there are any auth hooks configured
SELECT 
  hook_name,
  enabled,
  created_at
FROM auth.hooks
WHERE enabled = true;

-- STEP 5: Check for any RLS policies on auth.users that might interfere
SELECT '=== STEP 5: RLS policies on auth.users ===' as step;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- STEP 6: Check the actual function definition
SELECT '=== STEP 6: Current handle_new_user function ===' as step;
SELECT 
  proname,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user'
LIMIT 1;