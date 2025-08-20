-- Fix signup issues related to email confirmation

-- 1. First, let's see the current handle_new_user function
\sf handle_new_user

-- 2. Create an improved version that handles email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert the profile with basic info
  INSERT INTO public.profiles (
    id, 
    email, 
    created_at,
    storage_limit,
    storage_used
  )
  VALUES (
    new.id, 
    new.email, 
    NOW(),
    1073741824, -- 1GB default
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; -- Update email if profile exists
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create a function to auto-confirm users during beta
-- This bypasses email confirmation requirement
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the user
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to auto-confirm (for beta testing only)
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;
CREATE TRIGGER auto_confirm_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- 6. Test the profile creation with all required fields
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO profiles (id, email, created_at, storage_limit, storage_used)
  VALUES (test_id, 'test@example.com', NOW(), 1073741824, 0);
  
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE 'Profile creation test successful';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Profile creation failed: %', SQLERRM;
END $$;

-- 7. Show current auth triggers
SELECT 
  tgname as trigger_name,
  CASE 
    WHEN tgtype = 7 THEN 'AFTER INSERT'
    WHEN tgtype = 19 THEN 'AFTER INSERT OR UPDATE'
    ELSE 'OTHER'
  END as trigger_type,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;