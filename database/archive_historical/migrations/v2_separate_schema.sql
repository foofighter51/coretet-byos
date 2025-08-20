-- ============================================================================
-- SAFER APPROACH: Create V2 in Separate Schema
-- ============================================================================
-- This creates all V2 tables in a 'v2' schema, completely isolated from V1
-- ============================================================================

-- Create a separate schema for V2
CREATE SCHEMA IF NOT EXISTS v2;

-- Grant permissions
GRANT USAGE ON SCHEMA v2 TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA v2 TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA v2 TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA v2 TO authenticated;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA v2 
GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA v2 
GRANT ALL ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA v2 
GRANT ALL ON FUNCTIONS TO authenticated;

-- Now create all tables in v2 schema
CREATE TABLE IF NOT EXISTS v2.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  project_type TEXT DEFAULT 'album',
  status TEXT DEFAULT 'active',
  target_release_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{"visibility": "private"}'
);

CREATE TABLE IF NOT EXISTS v2.song_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version_number TEXT NOT NULL,
  branch_name TEXT,
  status TEXT DEFAULT 'draft',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(project_id, version_number)
);

-- Continue with other tables...
-- This way V2 is completely separate from V1!