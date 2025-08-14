-- Check what columns exist in the tracks table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- If tracks table doesn't exist, create it
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  s3_key TEXT NOT NULL,
  duration REAL,
  category TEXT NOT NULL CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tracks
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Create policies for tracks table
CREATE POLICY "Users can view own tracks" ON tracks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracks" ON tracks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracks" ON tracks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracks" ON tracks
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);