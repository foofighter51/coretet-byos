-- Test anonymous user access to invites

-- 1. First, let's see what invites exist (as admin)
SELECT code, used_by, expires_at > NOW() as is_valid 
FROM invites 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Test as anonymous user
SET LOCAL ROLE anon;

-- Try to select a specific invite code
SELECT 
  id,
  code,
  CASE 
    WHEN used_by IS NOT NULL THEN 'Used'
    WHEN expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM invites
WHERE code = '20PEK59L';

-- Try the exact query used in signup
SELECT *
FROM invites
WHERE code = '20PEK59L'
  AND used_by IS NULL
  AND expires_at > NOW();

-- Count visible invites
SELECT COUNT(*) as visible_invite_count FROM invites;

RESET ROLE;

-- 3. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'invites';