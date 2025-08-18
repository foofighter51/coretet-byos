-- Surgical RLS Fix - Target Only the Problematic Policy
-- Based on the error, the issue is specifically with user_roles table

-- Step 1: Identify the exact problem policy on user_roles
-- The error mentions "infinite recursion detected in policy for relation user_roles"

-- Step 2: Temporarily disable RLS only on user_roles table
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Step 3: Test if profiles table works without user_roles RLS
-- Keep profiles RLS enabled but with a simple policy

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Simple profile access" ON profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role profiles access" ON profiles;

-- Create ultra-simple profile policy that doesn't reference user_roles
CREATE POLICY "Basic profile access" ON profiles
  FOR SELECT 
  USING (
    -- Direct UUID comparison, no function calls
    id = '68b47b60-e826-4c4b-a433-90759f1240c8'::uuid
    OR
    -- Allow service role
    current_setting('role') = 'service_role'
  );

-- Step 4: Allow profile updates for the specific user  
CREATE POLICY "Basic profile update" ON profiles
  FOR UPDATE 
  USING (
    id = '68b47b60-e826-4c4b-a433-90759f1240c8'::uuid
    OR
    current_setting('role') = 'service_role'
  )
  WITH CHECK (
    id = '68b47b60-e826-4c4b-a433-90759f1240c8'::uuid
    OR
    current_setting('role') = 'service_role'
  );

-- Step 5: Test this works, then we can make it dynamic later
-- This should allow the specific user to load while we debug the auth.uid() issue