-- Migration: Convert collaborators to Supabase Auth users
-- This unifies the authentication system so RLS policies work correctly

-- 1. Add role column to identify user types (will be stored in user metadata)
-- Main users = 'artist', Collaborators = 'collaborator'

-- 2. Create a function to migrate existing collaborators
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

-- 3. Add a temporary mapping table to track migration
CREATE TABLE IF NOT EXISTS collaborator_migration_map (
  old_collaborator_id UUID PRIMARY KEY REFERENCES collaborators(id),
  new_auth_user_id UUID REFERENCES auth.users(id),
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Update playlist_shares to use auth.users instead of collaborators
ALTER TABLE playlist_shares 
  ADD COLUMN shared_with_user_id UUID REFERENCES auth.users(id);

-- 5. Create new RLS policies that check user role
-- Example for audio_sections table:
CREATE POLICY "Users can view sections for tracks they have access to" ON audio_sections
  FOR SELECT USING (
    track_id IN (
      -- User's own tracks (artists only)
      SELECT id FROM tracks 
      WHERE user_id = auth.uid() 
        AND (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'artist'
      
      UNION
      
      -- Tracks in playlists shared with this user (collaborators)
      SELECT DISTINCT pt.track_id 
      FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      WHERE ps.shared_with_user_id = auth.uid()
        AND ps.status = 'active'
    )
  );

CREATE POLICY "Users can create sections for tracks they have access to" ON audio_sections
  FOR INSERT WITH CHECK (
    track_id IN (
      -- User's own tracks (artists only)
      SELECT id FROM tracks 
      WHERE user_id = auth.uid() 
        AND (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'artist'
      
      UNION
      
      -- Tracks in playlists shared with this user (collaborators can edit)
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

-- 6. Similar policies for arrangements table
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

-- 7. After migration is complete, we would:
-- DROP TABLE collaborators;
-- ALTER TABLE playlist_shares DROP COLUMN collaborator_id;
-- ALTER TABLE playlist_shares DROP COLUMN shared_with_email;
-- ALTER TABLE playlist_shares ALTER COLUMN shared_with_user_id SET NOT NULL;

-- Note: The actual migration of users needs to be done via Supabase Admin API
-- This SQL provides the structure and policies needed after migration