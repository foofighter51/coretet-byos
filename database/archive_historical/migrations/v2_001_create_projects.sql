-- ============================================================================
-- CoreTet V2: Project Hierarchy Schema
-- ============================================================================
-- This migration creates the songwriter project structure
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. PROJECTS TABLE - Main container for songwriter projects/albums
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  project_type TEXT DEFAULT 'album', -- album, ep, single, collection
  status TEXT DEFAULT 'active', -- active, archived, completed
  target_release_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- Flexible field for extra data
  settings JSONB DEFAULT '{"visibility": "private"}',
  
  -- Indexes for performance
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- 2. SONG_VERSIONS TABLE - Major versions of a song (v1, v2, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.song_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version_number TEXT NOT NULL, -- "1.0.0", "2.1.0", etc.
  branch_name TEXT, -- "acoustic", "radio-edit", "extended"
  status TEXT DEFAULT 'draft', -- draft, review, approved, released
  is_primary BOOLEAN DEFAULT FALSE, -- Mark the main version
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Prevent duplicate version numbers within a project
  UNIQUE(project_id, version_number)
);

CREATE INDEX idx_song_versions_project_id ON public.song_versions(project_id);
CREATE INDEX idx_song_versions_status ON public.song_versions(status);
CREATE INDEX idx_song_versions_is_primary ON public.song_versions(is_primary);

-- 3. VERSION_ITERATIONS TABLE - Individual takes/attempts of a version
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.version_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.song_versions(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL, -- Link to existing track
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iteration_number INTEGER NOT NULL,
  name TEXT,
  notes TEXT,
  is_selected BOOLEAN DEFAULT FALSE, -- Mark the chosen iteration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Prevent duplicate iteration numbers within a version
  UNIQUE(version_id, iteration_number)
);

CREATE INDEX idx_version_iterations_version_id ON public.version_iterations(version_id);
CREATE INDEX idx_version_iterations_track_id ON public.version_iterations(track_id);
CREATE INDEX idx_version_iterations_is_selected ON public.version_iterations(is_selected);

-- 4. PROJECT_COLLABORATORS TABLE - Team members on projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer', -- owner, editor, commenter, viewer
  permissions JSONB DEFAULT '{"can_edit": false, "can_delete": false, "can_invite": false}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Prevent duplicate collaborators
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX idx_project_collaborators_role ON public.project_collaborators(role);

-- 5. VERSION_METADATA TABLE - Lyrics, chords, notes for versions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.version_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.song_versions(id) ON DELETE CASCADE,
  lyrics TEXT,
  chords TEXT,
  song_structure TEXT, -- "Verse, Chorus, Verse, Chorus, Bridge, Chorus"
  tempo INTEGER,
  key TEXT,
  time_signature TEXT,
  genre TEXT,
  mood TEXT,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One metadata record per version
  UNIQUE(version_id)
);

CREATE INDEX idx_version_metadata_version_id ON public.version_metadata(version_id);

-- 6. Add project reference to existing tracks (backward compatible)
-- ============================================================================
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES public.song_versions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS iteration_id UUID REFERENCES public.version_iterations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tracks_project_id ON public.tracks(project_id);
CREATE INDEX IF NOT EXISTS idx_tracks_version_id ON public.tracks(version_id);

-- 7. Row Level Security (RLS) Policies
-- ============================================================================

-- Projects RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR 
         EXISTS (SELECT 1 FROM public.project_collaborators 
                WHERE project_id = projects.id AND user_id = auth.uid()));

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR 
         EXISTS (SELECT 1 FROM public.project_collaborators 
                WHERE project_id = projects.id AND user_id = auth.uid() 
                AND role IN ('owner', 'editor')));

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Song Versions RLS
ALTER TABLE public.song_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions in their projects" ON public.song_versions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR 
         EXISTS (SELECT 1 FROM public.project_collaborators pc
                JOIN public.projects p ON pc.project_id = p.id
                WHERE p.id = song_versions.project_id AND pc.user_id = auth.uid()));

CREATE POLICY "Users can create versions in their projects" ON public.song_versions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update versions in their projects" ON public.song_versions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR 
         EXISTS (SELECT 1 FROM public.project_collaborators pc
                WHERE pc.project_id = song_versions.project_id 
                AND pc.user_id = auth.uid() 
                AND pc.role IN ('owner', 'editor')));

-- Version Iterations RLS
ALTER TABLE public.version_iterations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view iterations" ON public.version_iterations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR 
         EXISTS (SELECT 1 FROM public.song_versions sv
                JOIN public.project_collaborators pc ON pc.project_id = sv.project_id
                WHERE sv.id = version_iterations.version_id AND pc.user_id = auth.uid()));

CREATE POLICY "Users can create iterations" ON public.version_iterations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update iterations" ON public.version_iterations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Project Collaborators RLS
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborators" ON public.project_collaborators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.project_collaborators pc2
                WHERE pc2.project_id = project_collaborators.project_id 
                AND pc2.user_id = auth.uid()));

CREATE POLICY "Project owners can manage collaborators" ON public.project_collaborators
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects 
                WHERE id = project_collaborators.project_id 
                AND user_id = auth.uid()));

-- Version Metadata RLS
ALTER TABLE public.version_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metadata" ON public.version_metadata
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.song_versions sv
                JOIN public.projects p ON sv.project_id = p.id
                WHERE sv.id = version_metadata.version_id 
                AND (p.user_id = auth.uid() OR 
                     EXISTS (SELECT 1 FROM public.project_collaborators 
                            WHERE project_id = p.id AND user_id = auth.uid()))));

CREATE POLICY "Users can manage metadata" ON public.version_metadata
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.song_versions sv
                JOIN public.projects p ON sv.project_id = p.id
                WHERE sv.id = version_metadata.version_id 
                AND (p.user_id = auth.uid() OR 
                     EXISTS (SELECT 1 FROM public.project_collaborators 
                            WHERE project_id = p.id 
                            AND user_id = auth.uid() 
                            AND role IN ('owner', 'editor')))));

-- 8. Helper Functions
-- ============================================================================

-- Function to automatically create iteration numbers
CREATE OR REPLACE FUNCTION get_next_iteration_number(p_version_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(iteration_number), 0) + 1
  INTO next_number
  FROM public.version_iterations
  WHERE version_id = p_version_id;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate a playlist to a project
CREATE OR REPLACE FUNCTION migrate_playlist_to_project(p_playlist_id UUID)
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
  v_playlist RECORD;
  v_version_id UUID;
BEGIN
  -- Get playlist details
  SELECT * INTO v_playlist FROM public.playlists WHERE id = p_playlist_id;
  
  -- Create project from playlist
  INSERT INTO public.projects (user_id, name, description, metadata)
  VALUES (v_playlist.user_id, v_playlist.name, v_playlist.description, 
          jsonb_build_object('migrated_from_playlist', p_playlist_id))
  RETURNING id INTO v_project_id;
  
  -- Create initial version
  INSERT INTO public.song_versions (project_id, user_id, name, version_number, is_primary)
  VALUES (v_project_id, v_playlist.user_id, 'Version 1', '1.0.0', true)
  RETURNING id INTO v_version_id;
  
  -- Link existing tracks to the version
  UPDATE public.tracks 
  SET project_id = v_project_id,
      version_id = v_version_id
  WHERE id IN (SELECT track_id FROM public.playlist_tracks WHERE playlist_id = p_playlist_id);
  
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Update triggers for timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_song_versions_updated_at BEFORE UPDATE ON public.song_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_version_metadata_updated_at BEFORE UPDATE ON public.version_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROLLBACK SCRIPT (Save this separately)
-- ============================================================================
-- DROP TABLE IF EXISTS public.version_metadata CASCADE;
-- DROP TABLE IF EXISTS public.project_collaborators CASCADE;
-- DROP TABLE IF EXISTS public.version_iterations CASCADE;
-- DROP TABLE IF EXISTS public.song_versions CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;
-- ALTER TABLE public.tracks DROP COLUMN IF EXISTS project_id;
-- ALTER TABLE public.tracks DROP COLUMN IF EXISTS version_id;
-- ALTER TABLE public.tracks DROP COLUMN IF EXISTS iteration_id;
-- DROP FUNCTION IF EXISTS get_next_iteration_number;
-- DROP FUNCTION IF EXISTS migrate_playlist_to_project;
-- DROP FUNCTION IF EXISTS update_updated_at CASCADE;