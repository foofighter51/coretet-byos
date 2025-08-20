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
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'auth_debug_log'
  ) THEN
    -- Show recent entries
    RAISE NOTICE 'Debug log exists, checking entries...';
    PERFORM * FROM auth_debug_log 
    WHERE created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC 
    LIMIT 10;
  ELSE
    RAISE NOTICE 'Debug log table does not exist';
  END IF;
END $$;

-- STEP 3: Check the actual function definition
SELECT '=== STEP 3: Current handle_new_user function ===' as step;
SELECT 
  proname,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user'
LIMIT 1;

-- STEP 4: Check for any RLS policies on auth.users
SELECT '=== STEP 4: RLS status ===' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- STEP 5: Check if profiles table has all required columns
SELECT '=== STEP 5: Profiles table structure ===' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- STEP 6: Test a minimal user creation (without using auth.signUp)
SELECT '=== STEP 6: Test minimal user creation ===' as step;
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'debug_test_' || extract(epoch from now())::text || '@example.com';
BEGIN
  -- First just test if we can insert into profiles
  BEGIN
    INSERT INTO profiles (id, email) VALUES (test_id, test_email);
    RAISE NOTICE 'SUCCESS: Can insert into profiles table';
    DELETE FROM profiles WHERE id = test_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'FAILED: Cannot insert into profiles - %', SQLERRM;
  END;
END $$;

-- STEP 7: Check Supabase project settings
SELECT '=== STEP 7: Database version and settings ===' as step;
SELECT version();
SELECT current_setting('server_version');

-- STEP 8: Check if there are any custom auth settings
SELECT '=== STEP 8: Auth schema tables ===' as step;
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'auth'
ORDER BY table_name;