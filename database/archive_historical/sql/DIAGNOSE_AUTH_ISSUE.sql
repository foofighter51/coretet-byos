-- Diagnose the auth signup issue

-- 1. First, check if email confirmations are required
-- This is often the root cause of 500 errors
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'WARNING: Email confirmation may be enabled in Supabase Dashboard'
    ELSE 'Email confirmation check passed'
  END as email_confirmation_status
FROM auth.users
WHERE email_confirmed_at IS NULL
LIMIT 1;

-- 2. Check the existing triggers on auth.users
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- 3. Test the handle_new_user function with a real user
-- First create a test user in auth.users
DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT := 'test_' || extract(epoch from now())::text || '@example.com';
BEGIN
  -- Insert into auth.users (minimal required fields)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    test_email,
    crypt('testpassword123', gen_salt('bf')),
    NOW(), -- Auto-confirm
    NOW(),
    NOW()
  )
  RETURNING id INTO test_user_id;
  
  -- Check if profile was created by trigger
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
    RAISE NOTICE 'SUCCESS: Profile was created by trigger for user %', test_user_id;
  ELSE
    RAISE NOTICE 'FAILED: Profile was NOT created by trigger for user %', test_user_id;
  END IF;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test failed with error: %', SQLERRM;
END $$;

-- 4. Check if there are any database policies blocking user creation
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'auth'
AND tablename = 'users';

-- 5. Verify the profiles table structure
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('id', 'email', 'created_at', 'storage_limit', 'storage_used')
ORDER BY ordinal_position;

-- 6. IMPORTANT: Instructions for Supabase Dashboard
SELECT '
CRITICAL: You MUST disable email confirmations in Supabase Dashboard:
1. Go to Authentication > Settings
2. Find "Enable email confirmations" 
3. Turn it OFF
4. Click Save

This is likely causing the 500 error during signup!' as instructions;