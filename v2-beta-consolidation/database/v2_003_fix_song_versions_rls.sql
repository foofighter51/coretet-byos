-- Fix RLS policies for song_versions table
-- Allow users to create and manage versions of their works

-- Enable RLS if not already enabled
ALTER TABLE song_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Users can view their own song versions" ON song_versions;
DROP POLICY IF EXISTS "Users can create song versions for their projects" ON song_versions;
DROP POLICY IF EXISTS "Users can update their own song versions" ON song_versions;
DROP POLICY IF EXISTS "Users can delete their own song versions" ON song_versions;

-- Create comprehensive RLS policies

-- Policy for viewing song versions
CREATE POLICY "Users can view their own song versions" 
ON song_versions FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = song_versions.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Policy for creating song versions
CREATE POLICY "Users can create song versions for their projects"
ON song_versions FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND 
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = song_versions.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Policy for updating song versions
CREATE POLICY "Users can update their own song versions"
ON song_versions FOR UPDATE
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = song_versions.project_id 
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = song_versions.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Policy for deleting song versions
CREATE POLICY "Users can delete their own song versions"
ON song_versions FOR DELETE
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = song_versions.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Also check version_iterations table
ALTER TABLE version_iterations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view iterations of their versions" ON version_iterations;
DROP POLICY IF EXISTS "Users can create iterations for their versions" ON version_iterations;
DROP POLICY IF EXISTS "Users can update their own iterations" ON version_iterations;
DROP POLICY IF EXISTS "Users can delete their own iterations" ON version_iterations;

-- Create policies for version_iterations
CREATE POLICY "Users can view iterations of their versions"
ON version_iterations FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM song_versions sv
        JOIN projects p ON p.id = sv.project_id
        WHERE sv.id = version_iterations.version_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create iterations for their versions"
ON version_iterations FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND 
    EXISTS (
        SELECT 1 FROM song_versions sv
        JOIN projects p ON p.id = sv.project_id
        WHERE sv.id = version_iterations.version_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own iterations"
ON version_iterations FOR UPDATE
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM song_versions sv
        JOIN projects p ON p.id = sv.project_id
        WHERE sv.id = version_iterations.version_id 
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM song_versions sv
        JOIN projects p ON p.id = sv.project_id
        WHERE sv.id = version_iterations.version_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own iterations"
ON version_iterations FOR DELETE
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM song_versions sv
        JOIN projects p ON p.id = sv.project_id
        WHERE sv.id = version_iterations.version_id 
        AND p.user_id = auth.uid()
    )
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');