-- Remove problematic triggers and keep only the minimal profile creation

-- 1. First show current triggers
SELECT 'BEFORE: Current triggers on auth.users' as status;
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgisinternal = false;

-- 2. Remove the auto_confirm trigger that's trying to update auth.users
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user();

-- 3. Check if there's an update_user_storage trigger on auth.users and remove it
DROP TRIGGER IF EXISTS update_user_storage_trigger ON auth.users;

-- 4. Ensure we have only the minimal profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create profile, don't touch auth.users
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Show final state
SELECT 'AFTER: Current triggers on auth.users' as status;
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgisinternal = false;

-- 7. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- 8. If you need email confirmation disabled, update auth config instead
-- This is safer than trying to update auth.users in a trigger
SELECT 'To disable email confirmation, go to Supabase Dashboard > Authentication > Settings > Email Auth and disable "Enable email confirmations"' as note;