-- Fix infinite recursion in projects RLS policies
-- The issue is caused by policies referencing project_collaborators which may reference back to projects

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create simpler policies without circular references
-- For now, we'll only allow users to manage their own projects directly
-- We can add collaboration features later with more careful policy design

-- SELECT: Users can only view projects they own
CREATE POLICY "Users view own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can create projects with their own user_id
CREATE POLICY "Users create own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update projects they own
CREATE POLICY "Users update own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete projects they own
CREATE POLICY "Users delete own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also check project_collaborators policies to avoid circular references
DO $$
BEGIN
    -- Drop any project_collaborators policies that might cause recursion
    DROP POLICY IF EXISTS "Project members view collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners add collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners update collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners remove collaborators" ON project_collaborators;
    
    -- Create simple policies for project_collaborators
    -- Only check user_id, not project ownership to avoid recursion
    CREATE POLICY "Users view collaborations they're part of"
    ON project_collaborators FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    
    -- For now, disable adding collaborators until we fix the recursion properly
    CREATE POLICY "Nobody can add collaborators yet"
    ON project_collaborators FOR INSERT
    TO authenticated
    WITH CHECK (false);
    
    CREATE POLICY "Nobody can update collaborators yet"
    ON project_collaborators FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);
    
    CREATE POLICY "Nobody can delete collaborators yet"
    ON project_collaborators FOR DELETE
    TO authenticated
    USING (false);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'project_collaborators table or policies may not exist: %', SQLERRM;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');