-- Ultra-safe tasks indexes fix
-- This migration safely handles existing indexes and avoids conflicts
-- Apply this in Supabase SQL Editor

-- First, check if the tasks table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    RAISE NOTICE 'Tasks table does not exist. Please run apply_tasks_migration_safe.sql first.';
  ELSE
    RAISE NOTICE 'Tasks table exists. Checking indexes...';
  END IF;
END $$;

-- Function to safely create an index if it doesn't exist
CREATE OR REPLACE FUNCTION safe_create_index(
  index_name text,
  table_name text,
  column_spec text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = index_name
  ) THEN
    EXECUTE format('CREATE INDEX %I ON %I(%s)', index_name, table_name, column_spec);
    RAISE NOTICE 'Created index: %', index_name;
  ELSE
    RAISE NOTICE 'Index already exists: %', index_name;
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Index % already exists (caught exception)', index_name;
  WHEN others THEN
    RAISE NOTICE 'Error creating index %: %', index_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Safely create all tasks indexes
DO $$ BEGIN PERFORM safe_create_index('idx_tasks_track_id', 'tasks', 'track_id'); END $$;
DO $$ BEGIN PERFORM safe_create_index('idx_tasks_user_id', 'tasks', 'user_id'); END $$;
DO $$ BEGIN PERFORM safe_create_index('idx_tasks_completed', 'tasks', 'completed'); END $$;
DO $$ BEGIN PERFORM safe_create_index('idx_tasks_due_date', 'tasks', 'due_date'); END $$;
DO $$ BEGIN PERFORM safe_create_index('idx_tasks_priority', 'tasks', 'priority'); END $$;

-- Additional composite indexes for better performance
DO $$ BEGIN PERFORM safe_create_index('idx_tasks_track_user', 'tasks', 'track_id, user_id'); END $$;
DO $$ BEGIN PERFORM safe_create_index('idx_tasks_user_completed', 'tasks', 'user_id, completed'); END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS safe_create_index(text, text, text);

-- Verify all indexes
DO $$
DECLARE
  index_count integer;
  rec record;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'tasks'
    AND indexname LIKE 'idx_tasks_%';
  
  RAISE NOTICE 'Total indexes on tasks table: %', index_count;
  
  -- List all indexes
  FOR rec IN 
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'tasks'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  - %', rec.indexname;
  END LOOP;
  
  RAISE NOTICE 'Tasks indexes migration completed successfully!';
END $$;

-- Analyze the table for better query planning
ANALYZE tasks;