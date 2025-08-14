-- Fix the auth trigger that's causing 500 errors during signup

-- 1. First, drop all existing auth triggers to start clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;

-- 2. Drop the functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.auto_confirm_user();

-- 3. Create a minimal handle_new_user function that won't fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if profile doesn't exist
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- 6. Check foreign key constraints on profiles table
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND contype = 'f';

-- 7. Check if there's a users table that profiles references
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name = 'users'
ORDER BY table_schema;

-- 8. If profiles references auth.users, we need to update the constraint
-- First check current constraint
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='profiles';

-- 7. Show the current state
SELECT 'Current auth.users triggers:' as info;
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 8. Check if profiles table has all required columns with defaults
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;