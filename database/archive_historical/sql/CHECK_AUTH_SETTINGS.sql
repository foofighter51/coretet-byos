-- Check auth settings and profile trigger

-- 1. Check if there's a trigger on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 2. Check profile table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if invited_by column exists in profiles
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'profiles'
  AND column_name = 'invited_by'
) as has_invited_by_column;

-- 4. Check for any functions that might be called on signup
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%profile%'
OR routine_name LIKE '%user%'
OR routine_name LIKE '%signup%';

-- 5. Add invited_by column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- 6. Create or replace the profile creation function to handle missing columns gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();