-- ============================================================================
-- VERIFY V2 TABLES WERE CREATED
-- ============================================================================
-- Run this to confirm all V2 tables exist
-- ============================================================================

-- This should return 5 rows (one for each table)
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'song_versions', 'version_iterations', 'project_collaborators', 'version_metadata')
ORDER BY table_name;

-- This should return 3 rows (the new columns in tracks)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tracks'
AND column_name IN ('project_id', 'version_id', 'iteration_id')
ORDER BY column_name;

-- Count of tables (should be 5)
SELECT COUNT(*) as v2_tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'song_versions', 'version_iterations', 'project_collaborators', 'version_metadata');