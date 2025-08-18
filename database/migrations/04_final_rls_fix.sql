-- Final RLS Fix - Completely Remove Problematic Policies
-- This completely disables RLS on user_roles to stop recursion

-- Step 1: Completely disable RLS on user_roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies on user_roles
DROP POLICY IF EXISTS "Allow users to view own role" ON user_roles;
DROP POLICY IF EXISTS "Allow users to insert own role" ON user_roles;
DROP POLICY IF EXISTS "Service role full access" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;

-- Step 3: For profiles, keep it simple
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role profiles access" ON profiles;

-- Step 4: Re-enable with the simplest possible policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Super simple profile policy - no recursion possible
CREATE POLICY "Simple profile access" ON profiles
  FOR ALL 
  USING (auth.uid()::text = id::text);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Super simple user_roles policy - no function calls that could recurse
CREATE POLICY "Simple role access" ON user_roles
  FOR ALL 
  USING (auth.uid()::text = user_id::text);