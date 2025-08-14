-- Fix Admin access to profiles table
-- Run this after FIX_ADMIN_DASHBOARD_RLS.sql

-- 1. Check current RLS status
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Add policy for admin to view all profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- User can see their own profile OR user is admin
  auth.uid() = id OR auth.email() = 'ericexley@gmail.com'
);

-- 3. Ensure admin can also see all tracks for statistics
DROP POLICY IF EXISTS "Admin can view all tracks" ON tracks;

CREATE POLICY "Admin can view all tracks"
ON tracks FOR SELECT
TO authenticated
USING (
  -- User can see their own tracks OR user is admin
  user_id = auth.uid() OR auth.email() = 'ericexley@gmail.com'
);

-- 4. Verify the fix
SELECT 
  'Admin profiles access configured!' as status,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM tracks) as total_tracks;