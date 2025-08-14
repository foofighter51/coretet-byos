-- Test invite code validation process
-- Run these queries to verify invite codes work properly

-- 1. First, check if the invite code validation query works
-- Replace 'TESTCODE' with an actual invite code you want to test
DO $$
DECLARE
  test_code TEXT := 'TESTCODE'; -- REPLACE THIS with your actual code
  invite_record RECORD;
BEGIN
  -- This mimics what the app does during signup
  SELECT * INTO invite_record
  FROM invites
  WHERE code = test_code
    AND used_by IS NULL
    AND expires_at > NOW();
    
  IF invite_record.id IS NOT NULL THEN
    RAISE NOTICE 'SUCCESS: Code % is VALID and can be used', test_code;
    RAISE NOTICE 'Details: Created on %, Expires on %', 
      invite_record.created_at::DATE, 
      invite_record.expires_at::DATE;
  ELSE
    -- Check why it failed
    SELECT * INTO invite_record
    FROM invites
    WHERE code = test_code;
    
    IF invite_record.id IS NULL THEN
      RAISE NOTICE 'FAILED: Code % does not exist', test_code;
    ELSIF invite_record.used_by IS NOT NULL THEN
      RAISE NOTICE 'FAILED: Code % has already been used', test_code;
    ELSIF invite_record.expires_at < NOW() THEN
      RAISE NOTICE 'FAILED: Code % expired on %', test_code, invite_record.expires_at::DATE;
    END IF;
  END IF;
END $$;

-- 2. Check RLS policies on invites table
SELECT 
  'Invites table RLS is ' || CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'invites';

-- 3. Test if anonymous users can read invites (they shouldn't for security)
-- But authenticated users validating during signup should be able to
SELECT 
  rolname,
  CASE 
    WHEN has_table_privilege(rolname, 'invites', 'SELECT') THEN 'CAN READ'
    ELSE 'CANNOT READ'
  END as read_permission
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated');

-- 4. Check the actual validation that happens in your AuthContext
-- This shows what the app sees when checking an invite
SELECT 
  code,
  CASE 
    WHEN used_by IS NOT NULL THEN 'Cannot use - already used'
    WHEN expires_at < NOW() THEN 'Cannot use - expired'
    ELSE 'Can use - valid'
  END as usability,
  expires_at
FROM invites
WHERE code IN (
  -- Add your invite codes here to check multiple at once
  'CODE1', 'CODE2', 'CODE3'
);

-- 5. If you need to debug a specific signup attempt, 
-- check if there are any entries in auth_debug_log
SELECT * FROM auth_debug_log 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;