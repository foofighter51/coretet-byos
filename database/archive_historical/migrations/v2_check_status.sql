-- ============================================================================
-- CHECK WHAT V2 TABLES ALREADY EXIST
-- ============================================================================
-- Run this to see what's already in your database
-- ============================================================================

-- Check if V2 tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'song_versions', 'version_iterations', 'project_collaborators', 'version_metadata')
ORDER BY table_name;

-- Check if tracks table has V2 columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tracks'
AND column_name IN ('project_id', 'version_id', 'iteration_id');