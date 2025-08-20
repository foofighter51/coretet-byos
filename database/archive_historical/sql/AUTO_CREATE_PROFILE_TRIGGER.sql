-- AUTO CREATE PROFILE TRIGGER
-- This ensures every authenticated user has a profile

-- 1. Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(profiles.email, EXCLUDED.email),
    updated_at = NOW();
  
  RETURN new;
END;
$$;

-- 2. Create trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix any existing users without profiles
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 4. Verify all users now have profiles
SELECT 
    'Profile Status' as section,
    COUNT(DISTINCT au.id) as total_users,
    COUNT(DISTINCT p.id) as users_with_profiles,
    COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id) as missing_profiles
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;