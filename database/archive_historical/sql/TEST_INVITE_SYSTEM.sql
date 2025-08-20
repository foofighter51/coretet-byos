-- Test invite system functionality

-- 1. Check if invites table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'invites'
) as invites_table_exists;

-- 2. Check invites table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invites'
ORDER BY ordinal_position;

-- 3. Check RLS policies on invites table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invites';

-- 4. Check current invites
SELECT 
  code,
  email,
  CASE 
    WHEN used_by IS NOT NULL THEN 'Used'
    WHEN expires_at < NOW() THEN 'Expired'
    ELSE 'Active'
  END as status,
  created_at,
  expires_at,
  used_at
FROM invites
ORDER BY created_at DESC
LIMIT 10;

-- 5. Create a test invite that expires in 7 days
-- Uncomment to create a test invite
/*
INSERT INTO invites (code, email, created_by, expires_at)
VALUES (
  'TEST' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  NULL,
  (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com' LIMIT 1),
  NOW() + INTERVAL '7 days'
)
RETURNING code, expires_at;
*/

-- 6. Test invite validation query (same as used in signup)
-- Replace 'TESTCODE' with an actual invite code to test
/*
SELECT 
  id,
  code,
  email,
  used_by,
  expires_at,
  CASE 
    WHEN used_by IS NOT NULL THEN 'Already used'
    WHEN expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM invites
WHERE code = 'TESTCODE'
  AND used_by IS NULL
  AND expires_at > NOW();
*/