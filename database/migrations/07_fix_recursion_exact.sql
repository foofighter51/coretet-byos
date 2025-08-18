-- Fix Exact Recursion Issue
-- Remove circular dependency between profiles and user_roles

-- Step 1: Drop the problematic admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Step 2: Keep the simple, working policies
-- These don't cause recursion because they don't reference other tables

-- Profiles: Keep the working policies
-- "Simple profile access" - works fine
-- "Users can read own profile" - works fine  
-- "Users can update own profile" - works fine

-- User_roles: Keep the working policies
-- "Simple role access" - works fine
-- "Users can read own role" - works fine

-- Step 3: Add admin access in a non-recursive way
-- Create admin policies that don't reference user_roles

-- Allow service_role (Supabase's service account) full access
CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL 
  TO service_role  
  USING (true)
  WITH CHECK (true);

-- For actual admin users, we'll handle this in application logic
-- rather than database policies to avoid recursion