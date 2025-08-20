-- Remove ALL auth triggers to test if they're causing the 500 error

-- 1. Drop all triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;

-- 2. Drop the functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS auto_confirm_user();

-- 3. List any remaining triggers on auth.users (should be empty)
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 4. Create profiles for existing users who might be missing them
INSERT INTO profiles (id, email, created_at, storage_limit, storage_used)
SELECT 
  id,
  email,
  created_at,
  1073741824,
  0
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. Status
SELECT 'All auth triggers removed! Try signup now.' as status;
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);