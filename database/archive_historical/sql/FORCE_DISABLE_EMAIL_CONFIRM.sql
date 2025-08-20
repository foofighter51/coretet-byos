-- Force disable email confirmation at the database level
-- This is a workaround if the Supabase Dashboard setting isn't working

-- 1. Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Force confirm the user email immediately
  UPDATE auth.users 
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = new.id;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail user creation on profile errors
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create a test to verify it works
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'signup_test_' || extract(epoch from now())::text || '@example.com';
BEGIN
  -- Simulate what happens during signup
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    test_id,
    'authenticated',
    'authenticated', 
    test_email,
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW()
  );
  
  -- Check results
  PERFORM pg_sleep(0.1); -- Brief pause for trigger
  
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = test_id 
    AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE NOTICE 'SUCCESS: User was auto-confirmed';
  ELSE
    RAISE NOTICE 'FAILED: User was not auto-confirmed';
  END IF;
  
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_id) THEN
    RAISE NOTICE 'SUCCESS: Profile was created';
  ELSE
    RAISE NOTICE 'FAILED: Profile was not created';
  END IF;
  
  -- Cleanup
  DELETE FROM profiles WHERE id = test_id;
  DELETE FROM auth.users WHERE id = test_id;
  
  RAISE NOTICE 'Test completed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test error: %', SQLERRM;
    -- Cleanup on error
    DELETE FROM profiles WHERE id = test_id;
    DELETE FROM auth.users WHERE id = test_id;
END $$;

-- 4. Show the result
SELECT 'Email confirmation workaround installed. Try signup again!' as status;