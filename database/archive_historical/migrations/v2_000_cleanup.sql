-- ============================================================================
-- CLEANUP SCRIPT - Run this FIRST to remove any partial V2 tables
-- ============================================================================
-- This safely removes any partially created V2 tables before fresh install
-- ============================================================================

-- Drop all V2 tables if they exist (CASCADE removes dependent objects)
DROP TABLE IF EXISTS public.version_metadata CASCADE;
DROP TABLE IF EXISTS public.project_collaborators CASCADE;
DROP TABLE IF EXISTS public.version_iterations CASCADE;
DROP TABLE IF EXISTS public.song_versions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Remove V2 columns from tracks table if they exist
ALTER TABLE public.tracks DROP COLUMN IF EXISTS project_id CASCADE;
ALTER TABLE public.tracks DROP COLUMN IF EXISTS version_id CASCADE;
ALTER TABLE public.tracks DROP COLUMN IF EXISTS iteration_id CASCADE;

-- Drop V2 functions if they exist
DROP FUNCTION IF EXISTS get_next_iteration_number CASCADE;
DROP FUNCTION IF EXISTS migrate_playlist_to_project CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- Now you're ready to run v2_001_create_projects.sql