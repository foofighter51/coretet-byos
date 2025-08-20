-- Fix the foreign key constraint issue with profiles table

-- 1. Check current foreign key constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND contype = 'f';

-- 2. Drop the incorrect foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Add the correct foreign key to auth.users
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Now recreate the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with default values
  INSERT INTO public.profiles (
    id, 
    email,
    storage_limit,
    storage_used,
    is_active
  )
  VALUES (
    new.id, 
    new.email,
    1073741824, -- 1GB default
    0,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Test with an actual auth.users entry
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get a real user id from auth.users
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to create a test profile
    INSERT INTO profiles (id, email, storage_limit, storage_used, is_active)
    VALUES (test_user_id, 'test@example.com', 1073741824, 0, true)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Profile insert test completed';
  ELSE
    RAISE NOTICE 'No users found in auth.users';
  END IF;
END $$;

-- 7. Show final state
SELECT 'Auth triggers after fix:' as status;
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 8. Verify constraint is correct
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND contype = 'f';