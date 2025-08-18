-- CoreTet V2 Complete Database Schema
-- Creates all V2 tables with proper structure and RLS policies

-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================================================
-- PROJECTS TABLE (Works)
-- ============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    description TEXT,
    cover_image_url TEXT,
    project_type VARCHAR(20) DEFAULT 'single' CHECK (project_type IN ('album', 'ep', 'single', 'collection')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    target_release_date DATE,
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SONG_VERSIONS TABLE (Versions)
-- ============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS song_versions CASCADE;

CREATE TABLE song_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version_number VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    branch_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'released')),
    is_primary BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for song_versions
CREATE TRIGGER update_song_versions_updated_at 
    BEFORE UPDATE ON song_versions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for song_versions
ALTER TABLE song_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their projects" ON song_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = song_versions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create versions for their projects" ON song_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = song_versions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update versions of their projects" ON song_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = song_versions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete versions of their projects" ON song_versions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = song_versions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERSION_ITERATIONS TABLE (Iterations/Takes)
-- ============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS version_iterations CASCADE;

CREATE TABLE version_iterations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES song_versions(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    iteration_number INTEGER NOT NULL,
    iteration_name VARCHAR(255),
    notes TEXT,
    is_selected BOOLEAN DEFAULT FALSE,
    file_url TEXT,
    file_size BIGINT,
    duration INTEGER, -- in seconds
    format VARCHAR(10),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for version_iterations
ALTER TABLE version_iterations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view iterations of their versions" ON version_iterations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_iterations.version_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create iterations for their versions" ON version_iterations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_iterations.version_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update iterations of their versions" ON version_iterations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_iterations.version_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete iterations of their versions" ON version_iterations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_iterations.version_id 
            AND p.user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERSION_METADATA TABLE (Additional metadata for versions)
-- ============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS version_metadata CASCADE;

CREATE TABLE version_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES song_versions(id) ON DELETE CASCADE,
    lyrics TEXT,
    chords TEXT,
    song_structure TEXT, -- "Verse, Chorus, Verse, Chorus, Bridge, Chorus"
    tempo INTEGER,
    key VARCHAR(10),
    time_signature VARCHAR(10),
    genre TEXT,
    mood TEXT,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for version_metadata
CREATE TRIGGER update_version_metadata_updated_at 
    BEFORE UPDATE ON version_metadata 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for version_metadata
ALTER TABLE version_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metadata of their versions" ON version_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_metadata.version_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create metadata for their versions" ON version_metadata
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_metadata.version_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update metadata of their versions" ON version_metadata
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_metadata.version_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete metadata of their versions" ON version_metadata
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM song_versions sv
            JOIN projects p ON p.id = sv.project_id
            WHERE sv.id = version_metadata.version_id 
            AND p.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PROJECT_COLLABORATORS TABLE (Collaboration)
-- ============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS project_collaborators CASCADE;

CREATE TABLE project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),
    permissions JSONB DEFAULT '{"can_edit": false, "can_delete": false, "can_invite": false}',
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, user_id)
);

-- RLS policies for project_collaborators (simplified to avoid recursion)
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborations they are part of" ON project_collaborators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_collaborators.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX idx_song_versions_project_id ON song_versions(project_id);
CREATE INDEX idx_song_versions_user_id ON song_versions(user_id);
CREATE INDEX idx_song_versions_is_primary ON song_versions(is_primary);

CREATE INDEX idx_version_iterations_version_id ON version_iterations(version_id);
CREATE INDEX idx_version_iterations_track_id ON version_iterations(track_id);
CREATE INDEX idx_version_iterations_is_selected ON version_iterations(is_selected);

CREATE INDEX idx_version_metadata_version_id ON version_metadata(version_id);

CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update project updated_at when versions change
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET updated_at = NOW() 
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project timestamp when versions change
CREATE TRIGGER update_project_on_version_change
    AFTER INSERT OR UPDATE OR DELETE ON song_versions
    FOR EACH ROW EXECUTE FUNCTION update_project_timestamp();

-- Trigger to update project timestamp when iterations change
CREATE TRIGGER update_project_on_iteration_change
    AFTER INSERT OR UPDATE OR DELETE ON version_iterations
    FOR EACH ROW EXECUTE FUNCTION update_project_timestamp();

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'CoreTet V2 database schema created successfully!';
    RAISE NOTICE 'Tables created: projects, song_versions, version_iterations, version_metadata, project_collaborators';
    RAISE NOTICE 'All RLS policies, triggers, and indexes are in place.';
END $$;