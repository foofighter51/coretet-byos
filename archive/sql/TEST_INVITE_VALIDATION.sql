-- Test invite code validation
-- This simulates what happens during signup

-- 1. Test as anonymous user (what happens during signup)
SET ROLE anon;

-- This is the query that runs during signup validation
SELECT 
  id,
  code,
  email,
  used_by,
  expires_at,
  CASE 
    WHEN used_by IS NOT NULL THEN 'Already used - validation should fail'
    WHEN expires_at < NOW() THEN 'Expired - validation should fail'
    ELSE 'Valid - signup should proceed'
  END as validation_result
FROM invites
WHERE code = '20PEK59L'  -- Replace with your test code
  AND used_by IS NULL
  AND expires_at > NOW();

-- Reset role
RESET ROLE;

-- 2. Check what anonymous users can see
SET ROLE anon;
SELECT COUNT(*) as visible_invites FROM invites;
RESET ROLE;

-- 3. Debug: Show all policies on invites table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invites'
ORDER BY policyname;