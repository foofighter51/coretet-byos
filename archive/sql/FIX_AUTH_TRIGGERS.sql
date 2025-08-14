-- Fix auth triggers to avoid conflicts

-- 1. First, drop the problematic auto-confirm trigger
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;
DROP FUNCTION IF EXISTS auto_confirm_user();

-- 2. Check current triggers on auth.users
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 3. Simplify the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Check if there are any other conflicting triggers
SELECT 
  n.nspname as schema,
  c.relname as table,
  t.tgname as trigger_name,
  p.proname as function_name,
  CASE t.tgtype
    WHEN 1 THEN 'BEFORE'
    WHEN 2 THEN 'AFTER'
    ELSE 'UNKNOWN'
  END as timing
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth'
ORDER BY c.relname, t.tgname;

-- 5. Test creating a user profile manually
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- First insert with minimal fields
  INSERT INTO profiles (id, email)
  VALUES (test_id, 'minimal@test.com')
  ON CONFLICT (id) DO NOTHING;
  
  -- Check if it worked
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_id) THEN
    RAISE NOTICE 'Minimal profile creation successful';
    DELETE FROM profiles WHERE id = test_id;
  ELSE
    RAISE NOTICE 'Minimal profile creation failed';
  END IF;
END $$;

-- 6. Make sure profiles table has proper defaults
ALTER TABLE profiles 
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN storage_limit SET DEFAULT 1073741824,
  ALTER COLUMN storage_used SET DEFAULT 0;

-- 7. Check Supabase auth settings
-- Note: Email confirmation must be disabled in Supabase Dashboard
-- Go to Authentication > Settings > Email Auth > Disable "Enable email confirmations"
SELECT 'IMPORTANT: Make sure to disable email confirmations in Supabase Dashboard!' as reminder;