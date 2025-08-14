-- Fix Admin Dashboard RLS permissions
-- Run this in Supabase SQL editor to fix admin access issues

-- 1. Enable RLS on invites table if not already enabled
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Admins can manage invites" ON invites;
DROP POLICY IF EXISTS "Users can view invites" ON invites;
DROP POLICY IF EXISTS "Admins can create invites" ON invites;
DROP POLICY IF EXISTS "Admins can update invites" ON invites;

-- 3. Create new policies for admin access
-- Since we don't have a user_roles table, we'll check by email
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
);

CREATE POLICY "Admin can update invites"
ON invites FOR UPDATE
TO authenticated
USING (auth.email() = 'ericexley@gmail.com')
WITH CHECK (auth.email() = 'ericexley@gmail.com');

-- 4. Allow users to view invites they created (optional)
CREATE POLICY "Users can view own invites"
ON invites FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);

-- 5. Check if invites table has the necessary columns
DO $$
BEGIN
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE invites ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 6. Verify the policies are working
SELECT 
  'Invites table RLS fixed!' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'invites';

-- 7. Test query (run this separately to verify access)
-- SELECT * FROM invites LIMIT 1;