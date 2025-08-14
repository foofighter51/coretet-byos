-- Part 2: Create collection_tracks table
-- Run this second

-- Create the table
CREATE TABLE IF NOT EXISTS collection_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_name TEXT NOT NULL,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, collection_name, track_id),
  UNIQUE(user_id, collection_name, position)
);

-- Enable RLS
ALTER TABLE collection_tracks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own collection tracks" ON collection_tracks
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_collection_tracks_user_collection 
  ON collection_tracks(user_id, collection_name);
CREATE INDEX IF NOT EXISTS idx_collection_tracks_track_id 
  ON collection_tracks(track_id);

-- Add updated_at trigger
CREATE TRIGGER update_collection_tracks_updated_at 
  BEFORE UPDATE ON collection_tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT 'collection_tracks table created' as status;