-- Update existing storage paths to include user IDs for proper isolation
-- This should be run AFTER the security fix migration

-- Create a temporary function to update storage paths
CREATE OR REPLACE FUNCTION update_storage_paths() RETURNS void AS $$
DECLARE
  track_record RECORD;
  new_path TEXT;
BEGIN
  -- Loop through all tracks
  FOR track_record IN 
    SELECT id, user_id, storage_path 
    FROM tracks 
    WHERE storage_path IS NOT NULL 
    AND storage_path NOT LIKE '%/%' -- Only update paths without folders
  LOOP
    -- Create new path with user_id folder
    new_path := track_record.user_id || '/' || track_record.storage_path;
    
    -- Update the track record
    UPDATE tracks 
    SET storage_path = new_path 
    WHERE id = track_record.id;
    
    -- Note: The actual files in storage need to be moved manually
    -- or through a separate script
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function
SELECT update_storage_paths();

-- Drop the temporary function
DROP FUNCTION update_storage_paths();

-- Add a note about the required manual steps
COMMENT ON TABLE tracks IS 'IMPORTANT: After running this migration, you need to manually move files in Supabase Storage from root to user_id folders';