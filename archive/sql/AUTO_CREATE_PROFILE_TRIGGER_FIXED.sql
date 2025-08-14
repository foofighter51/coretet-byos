-- AUTO CREATE PROFILE TRIGGER (FIXED)
-- This ensures every authenticated user has a profile

-- 1. Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (
    new.id,
    new.email,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(profiles.email, EXCLUDED.email);
  
  RETURN new;
END;
$$;

-- 2. Create trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix any existing users without profiles
INSERT INTO profiles (id, email, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.created_at, NOW())
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

-- 5. Check specific user that was having issues
SELECT 
    'User 86ded636-5c4c-4f4f-99bb-bcc7fa59ecf3' as section,
    au.id,
    au.email as auth_email,
    p.email as profile_email,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.id = '86ded636-5c4c-4f4f-99bb-bcc7fa59ecf3';