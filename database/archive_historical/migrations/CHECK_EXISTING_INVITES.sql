-- Check status of existing invite codes
-- Run this in Supabase SQL editor to see all invite codes and their status

-- 1. View all invite codes with their current status
SELECT 
  code,
  email,
  CASE 
    WHEN used_by IS NOT NULL THEN 'USED'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as status,
  created_at,
  expires_at,
  used_at,
  used_by,
  CASE 
    WHEN expires_at < NOW() THEN 
      'Expired ' || EXTRACT(DAY FROM NOW() - expires_at) || ' days ago'
    ELSE 
      'Expires in ' || EXTRACT(DAY FROM expires_at - NOW()) || ' days'
  END as expiry_info
FROM invites
ORDER BY created_at DESC;

-- 2. Count invites by status
SELECT 
  CASE 
    WHEN used_by IS NOT NULL THEN 'USED'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as status,
  COUNT(*) as count
FROM invites
GROUP BY status;

-- 3. Show only ACTIVE (usable) invite codes
SELECT 
  code,
  email,
  created_at,
  expires_at,
  'Active for ' || EXTRACT(DAY FROM expires_at - NOW()) || ' more days' as validity
FROM invites
WHERE used_by IS NULL 
  AND expires_at > NOW()
ORDER BY expires_at;

-- 4. Show EXPIRED codes that haven't been used (these might need extension)
SELECT 
  code,
  email,
  created_at,
  expires_at,
  'Expired ' || EXTRACT(DAY FROM NOW() - expires_at) || ' days ago' as expired_since
FROM invites
WHERE used_by IS NULL 
  AND expires_at < NOW()
ORDER BY expires_at DESC;

-- 5. To EXTEND expiration for all unused expired codes (uncomment to run):
/*
UPDATE invites
SET expires_at = NOW() + INTERVAL '30 days'
WHERE used_by IS NULL 
  AND expires_at < NOW();

-- Check how many were updated
SELECT 'Extended ' || COUNT(*) || ' expired invite codes by 30 days' as result
FROM invites
WHERE used_by IS NULL 
  AND expires_at > NOW()
  AND expires_at < NOW() + INTERVAL '31 days';
*/

-- 6. To EXTEND expiration for specific codes (replace codes as needed):
/*
UPDATE invites
SET expires_at = NOW() + INTERVAL '30 days'
WHERE code IN ('CODE1', 'CODE2', 'CODE3')
  AND used_by IS NULL;
*/

-- 7. To create a new test invite code:
/*
INSERT INTO invites (code, created_by, expires_at)
VALUES (
  UPPER(substr(md5(random()::text), 1, 8)),
  (SELECT id FROM profiles WHERE email = 'ericexley@gmail.com' LIMIT 1),
  NOW() + INTERVAL '30 days'
)
RETURNING code, expires_at;
*/