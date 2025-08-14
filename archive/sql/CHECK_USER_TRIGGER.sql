-- Check the current handle_new_user function and trigger

-- 1. View the current function definition
SELECT 
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Check all triggers on auth.users
SELECT 
  tgname as trigger_name,
  tgtype,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 3. Check profile table columns to see what's required
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND is_nullable = 'NO'
AND column_default IS NULL
ORDER BY ordinal_position;

-- 4. Test if we can manually insert a profile
-- This simulates what happens during signup
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Try to insert a test profile
  INSERT INTO profiles (id, email, created_at)
  VALUES (test_id, 'test@example.com', NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE 'Profile insert test successful';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Profile insert failed: %', SQLERRM;
END $$;

-- 5. Check if email confirmations are required
-- This is often a cause of 500 errors
SELECT 
  raw_app_meta_data->>'providers' as providers,
  raw_app_meta_data->>'provider' as provider,
  email_confirmed_at,
  confirmed_at
FROM auth.users
WHERE email = 'ericexley@gmail.com'
LIMIT 1;