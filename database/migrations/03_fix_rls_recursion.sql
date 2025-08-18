-- Fix RLS Policy Recursion Issues
-- This migration completely removes problematic policies and creates simpler ones

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can only view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;

-- Temporarily disable RLS to fix the table
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
CREATE POLICY "Allow users to view own role" ON user_roles
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own role" ON user_roles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow service role full access (for system operations)
CREATE POLICY "Service role full access" ON user_roles
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also fix profiles table policies to prevent similar issues
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Allow users to view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role profiles access" ON profiles
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);