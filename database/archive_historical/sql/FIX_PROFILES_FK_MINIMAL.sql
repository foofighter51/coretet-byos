-- Fix the foreign key constraint issue with minimal profile fields

-- 1. First check what columns actually exist in profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Drop the incorrect foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Add the correct foreign key to auth.users
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Create a minimal trigger function that only uses existing columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert only the required fields that exist
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- 7. Test with an actual auth.users entry
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get a real user id from auth.users
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to create a test profile with minimal fields
    INSERT INTO profiles (id, email)
    VALUES (test_user_id, 'test@example.com')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Profile insert test completed successfully';
  ELSE
    RAISE NOTICE 'No users found in auth.users to test with';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during test: %', SQLERRM;
END $$;

-- 8. Show final state
SELECT 'Auth triggers after fix:' as status;
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 9. Verify the foreign key constraint is correct
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND contype = 'f';