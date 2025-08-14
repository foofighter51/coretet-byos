-- Add display_name column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update RLS to allow users to update their own display_name
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);