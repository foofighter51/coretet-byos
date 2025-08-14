-- Combined migration: Create audio sections tables AND migrate collaborators to auth users

-- PART 1: CREATE AUDIO SECTIONS TABLES FIRST
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audio sections table
CREATE TABLE IF NOT EXISTS audio_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time DECIMAL(10,2) NOT NULL,
  end_time DECIMAL(10,2) NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arrangements table
CREATE TABLE IF NOT EXISTS arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_original BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arrangement sections junction table
CREATE TABLE IF NOT EXISTS arrangement_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE CASCADE,
  section_id UUID REFERENCES audio_sections(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(arrangement_id, position)
);

-- Enable RLS
ALTER TABLE audio_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrangement_sections ENABLE ROW LEVEL SECURITY;

-- PART 2: COLLABORATOR MIGRATION SETUP
-- ====================================

-- Create a function to migrate existing collaborators
CREATE OR REPLACE FUNCTION migrate_collaborators_to_auth()
RETURNS void AS $$
DECLARE
  collab RECORD;
  new_user_id UUID;
BEGIN
  -- Loop through all existing collaborators
  FOR collab IN SELECT * FROM collaborators LOOP
    -- Create auth user for each collaborator
    -- Note: In practice, you'd need to use Supabase Admin API to create users with passwords
    -- This is a placeholder showing the structure
    
    -- The actual user creation would happen via Supabase Admin API
    -- Here we just document what needs to happen:
    -- 1. Create auth.users entry with email and password
    -- 2. Set raw_user_meta_data with role = 'collaborator'
    -- 3. Store the new auth.users.id
    
    -- For now, we'll just output what needs to be done
    RAISE NOTICE 'Need to migrate collaborator: % (%)', collab.email, collab.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add a temporary mapping table to track migration
CREATE TABLE IF NOT EXISTS collaborator_migration_map (
  old_collaborator_id UUID PRIMARY KEY REFERENCES collaborators(id),
  new_auth_user_id UUID REFERENCES auth.users(id),
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update playlist_shares to use auth.users instead of collaborators
ALTER TABLE playlist_shares 
  ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES auth.users(id);

-- PART 3: RLS POLICIES FOR AUDIO SECTIONS
-- =======================================

-- RLS Policies for audio_sections
CREATE POLICY "Users can view sections for tracks they have access to" ON audio_sections
  FOR SELECT USING (
    track_id IN (
      -- User's own tracks
      SELECT id FROM tracks 
      WHERE user_id = auth.uid()
      
      UNION
      
      -- Tracks in playlists shared with this user (after migration)
      SELECT DISTINCT pt.track_id 
      FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      WHERE ps.shared_with_user_id = auth.uid()
        AND ps.status = 'active'
      
      UNION
      
      -- Tracks in playlists shared with collaborators (before migration)
      SELECT DISTINCT pt.track_id 
      FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      JOIN collaborators c ON ps.collaborator_id = c.id
      WHERE ps.shared_with_email = c.email
        AND ps.status = 'active'
        AND ps.collaborator_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create sections for tracks they have access to" ON audio_sections
  FOR INSERT WITH CHECK (
    track_id IN (
      -- User's own tracks
      SELECT id FROM tracks 
      WHERE user_id = auth.uid()
      
      UNION
      
      -- Tracks in playlists shared with this user (after migration)
      SELECT DISTINCT pt.track_id 
      FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      WHERE ps.shared_with_user_id = auth.uid()
        AND ps.status = 'active'
    )
  );

CREATE POLICY "Users can update their own sections" ON audio_sections
  FOR UPDATE USING (
    created_by = auth.uid()
    OR
    track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own sections" ON audio_sections
  FOR DELETE USING (
    created_by = auth.uid()
    OR
    track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for arrangements
CREATE POLICY "Users can view arrangements for accessible tracks" ON arrangements
  FOR SELECT USING (
    track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
      UNION
      SELECT DISTINCT pt.track_id 
      FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      WHERE ps.shared_with_user_id = auth.uid()
        AND ps.status = 'active'
      UNION
      SELECT DISTINCT pt.track_id 
      FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      JOIN collaborators c ON ps.collaborator_id = c.id
      WHERE ps.shared_with_email = c.email
        AND ps.status = 'active'
        AND ps.collaborator_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create arrangements for accessible tracks" ON arrangements
  FOR INSERT WITH CHECK (
    track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
      UNION
      SELECT DISTINCT pt.track_id 
      FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      WHERE ps.shared_with_user_id = auth.uid()
        AND ps.status = 'active'
    )
  );

CREATE POLICY "Users can update their own arrangements" ON arrangements
  FOR UPDATE USING (
    created_by = auth.uid()
    OR
    track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own arrangements" ON arrangements
  FOR DELETE USING (
    created_by = auth.uid()
    OR
    track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for arrangement_sections
CREATE POLICY "Users can view arrangement sections" ON arrangement_sections
  FOR SELECT USING (
    arrangement_id IN (
      SELECT id FROM arrangements
      WHERE track_id IN (
        SELECT id FROM tracks WHERE user_id = auth.uid()
        UNION
        SELECT DISTINCT pt.track_id 
        FROM playlist_tracks pt
        JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
        WHERE (ps.shared_with_user_id = auth.uid() OR ps.collaborator_id IS NOT NULL)
          AND ps.status = 'active'
      )
    )
  );

CREATE POLICY "Users can manage arrangement sections for their arrangements" ON arrangement_sections
  FOR ALL USING (
    arrangement_id IN (
      SELECT id FROM arrangements
      WHERE created_by = auth.uid()
        OR track_id IN (
          SELECT id FROM tracks WHERE user_id = auth.uid()
        )
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_sections_track_id ON audio_sections(track_id);
CREATE INDEX IF NOT EXISTS idx_audio_sections_created_by ON audio_sections(created_by);
CREATE INDEX IF NOT EXISTS idx_arrangements_track_id ON arrangements(track_id);
CREATE INDEX IF NOT EXISTS idx_arrangements_created_by ON arrangements(created_by);
CREATE INDEX IF NOT EXISTS idx_arrangement_sections_arrangement_id ON arrangement_sections(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_arrangement_sections_section_id ON arrangement_sections(section_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_audio_sections_updated_at BEFORE UPDATE ON audio_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arrangements_updated_at BEFORE UPDATE ON arrangements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();