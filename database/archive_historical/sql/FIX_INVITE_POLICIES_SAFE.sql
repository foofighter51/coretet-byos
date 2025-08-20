-- Fix invite system public access for signup flow
-- The issue is that during signup, users aren't authenticated yet
-- so they need public access to validate invite codes

-- First, check current policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'invites';

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admin can view all invites" ON invites;
DROP POLICY IF EXISTS "Admin can create invites" ON invites;
DROP POLICY IF EXISTS "Admin can update invites" ON invites;
DROP POLICY IF EXISTS "Users can view own invites" ON invites;
DROP POLICY IF EXISTS "Public can check invite codes" ON invites;
DROP POLICY IF EXISTS "Users can mark invites as used" ON invites;
DROP POLICY IF EXISTS "Users can view own created invites" ON invites;

-- Create new policies with proper access

-- 1. Allow public (unauthenticated) users to check invite codes for signup
CREATE POLICY "Public can check invite codes"
ON invites FOR SELECT
TO anon
USING (
  -- Only allow checking unused invites that haven't expired
  used_by IS NULL 
  AND expires_at > NOW()
);

-- 2. Admin policies
CREATE POLICY "Admin can view all invites"
ON invites FOR SELECT
TO authenticated
USING (
  auth.email() = 'ericexley@gmail.com'
);

CREATE POLICY "Admin can create invites"
ON invites FOR INSERT
TO authenticated
WITH CHECK (
  auth.email() = 'ericexley@gmail.com' 
  AND created_by = auth.uid()
);

CREATE POLICY "Admin can update invites"
ON invites FOR UPDATE
TO authenticated
USING (auth.email() = 'ericexley@gmail.com')
WITH CHECK (auth.email() = 'ericexley@gmail.com');

-- 3. Allow authenticated users to update invites when they use them
CREATE POLICY "Users can mark invites as used"
ON invites FOR UPDATE
TO authenticated
USING (
  -- Can only update if the invite is unused and not expired
  used_by IS NULL 
  AND expires_at > NOW()
)
WITH CHECK (
  -- Can only set used_by to their own ID
  used_by = auth.uid()
  AND used_at IS NOT NULL
);

-- 4. Users can view invites they created
CREATE POLICY "Users can view own created invites"
ON invites FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);

-- Grant necessary permissions
GRANT SELECT ON invites TO anon;
GRANT ALL ON invites TO authenticated;

-- Test the policies by checking what an anonymous user can see
-- This should only show unused, non-expired invites
/*
SET ROLE anon;
SELECT code, expires_at FROM invites 
WHERE used_by IS NULL AND expires_at > NOW();
RESET ROLE;
*/

-- Create a function to generate a proper 8-character code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a fresh test invite for testing
DO $$
DECLARE
  new_code TEXT;
  admin_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM auth.users WHERE email = 'ericexley@gmail.com' LIMIT 1;
  
  IF admin_id IS NULL THEN
    RAISE NOTICE 'Admin user not found';
    RETURN;
  END IF;
  
  -- Generate a unique code
  LOOP
    new_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invites WHERE code = new_code);
  END LOOP;
  
  -- Insert the invite
  INSERT INTO invites (code, email, created_by, expires_at)
  VALUES (
    new_code,
    NULL,
    admin_id,
    NOW() + INTERVAL '7 days'
  );
  
  RAISE NOTICE 'Created invite code: %', new_code;
  RAISE NOTICE 'Use this URL: https://yourapp.com?invite=%', new_code;
END $$;

-- Show recent invites
SELECT 
  code,
  CASE 
    WHEN used_by IS NOT NULL THEN 'Used'
    WHEN expires_at < NOW() THEN 'Expired'
    ELSE 'Active'
  END as status,
  created_at,
  expires_at
FROM invites
WHERE created_by = (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com' LIMIT 1)
ORDER BY created_at DESC
LIMIT 5;