-- Add soft delete functionality to tracks table
-- Run this in Supabase SQL Editor

-- Add deleted_at column to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tracks_deleted_at ON tracks(deleted_at);

-- Update RLS policies to hide deleted tracks by default
-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view their own tracks" ON tracks;

-- Create new select policy that excludes deleted tracks
CREATE POLICY "Users can view their own non-deleted tracks" 
ON tracks FOR SELECT 
USING (
  auth.uid() = user_id 
  AND deleted_at IS NULL
);

-- Create policy to allow viewing deleted tracks (for recovery UI)
CREATE POLICY "Users can view their own deleted tracks" 
ON tracks FOR SELECT 
USING (
  auth.uid() = user_id 
  AND deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '30 days'
);

-- Update the delete policy to set deleted_at instead of deleting
DROP POLICY IF EXISTS "Users can delete their own tracks" ON tracks;

-- Create soft delete policy
CREATE POLICY "Users can soft delete their own tracks" 
ON tracks FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
);

-- Create function to restore a deleted track
CREATE OR REPLACE FUNCTION restore_track(track_id UUID)
RETURNS void 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tracks 
  SET deleted_at = NULL 
  WHERE id = track_id 
  AND user_id = auth.uid()
  AND deleted_at IS NOT NULL;
END;
$$;

-- Create view for deleted tracks (simpler approach)
CREATE OR REPLACE VIEW deleted_tracks AS
SELECT * FROM tracks
WHERE deleted_at IS NOT NULL
AND deleted_at > NOW() - INTERVAL '30 days';

-- Grant permissions
GRANT SELECT ON deleted_tracks TO authenticated;

-- Test the setup
SELECT 
  'Soft delete system ready' as status,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_tracks,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_tracks
FROM tracks
WHERE user_id = auth.uid();