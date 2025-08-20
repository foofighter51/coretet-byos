-- TEMPORARY FIX: Allow ericexley@gmail.com to see their tracks
-- This is needed because the SQL editor doesn't have auth context

-- First, let's verify the email-based approach will work
SELECT 
  id as user_id,
  email
FROM auth.users
WHERE email = 'ericexley@gmail.com';

-- Create a temporary policy that uses email instead of auth.uid()
-- This allows the specific user to see their tracks
CREATE POLICY "Temporary: ericexley can view own tracks" ON tracks
  FOR SELECT
  USING (
    user_id = '55a58df9-3698-4973-9add-b82d76cde766'::uuid
  );

-- Verify it was created
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- IMPORTANT: This is temporary. The real issue is that your app 
-- might not be passing the correct auth context when fetching tracks.