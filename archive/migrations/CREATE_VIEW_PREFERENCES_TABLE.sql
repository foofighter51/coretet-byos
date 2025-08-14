-- =====================================================
-- CREATE VIEW PREFERENCES TABLE
-- Run this in Supabase SQL Editor to persist sorting preferences
-- =====================================================

-- 1. Create the view_preferences table
CREATE TABLE IF NOT EXISTS view_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  view_type TEXT NOT NULL, -- 'category', 'playlist', 'collection', 'rating', 'tags'
  view_id TEXT NOT NULL, -- category name, playlist id, collection name, etc.
  sort_by TEXT DEFAULT 'added', -- 'added', 'title', 'type', 'artist', 'album', 'duration', 'date'
  sort_direction TEXT DEFAULT 'desc', -- 'asc' or 'desc'
  view_mode TEXT DEFAULT 'list', -- 'list' or 'grid'
  manual_positions JSONB, -- { trackId: position } for manual ordering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, view_type, view_id)
);

-- 2. Create an index for faster lookups
CREATE INDEX idx_view_preferences_user_view 
ON view_preferences(user_id, view_type, view_id);

-- 3. Enable Row Level Security
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences" ON view_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON view_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON view_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON view_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create a function to upsert preferences (insert or update)
CREATE OR REPLACE FUNCTION upsert_view_preference(
  p_view_type TEXT,
  p_view_id TEXT,
  p_sort_by TEXT,
  p_sort_direction TEXT,
  p_view_mode TEXT,
  p_manual_positions JSONB DEFAULT NULL
)
RETURNS view_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result view_preferences;
BEGIN
  INSERT INTO view_preferences (
    user_id,
    view_type,
    view_id,
    sort_by,
    sort_direction,
    view_mode,
    manual_positions,
    updated_at
  )
  VALUES (
    auth.uid(),
    p_view_type,
    p_view_id,
    p_sort_by,
    p_sort_direction,
    p_view_mode,
    p_manual_positions,
    NOW()
  )
  ON CONFLICT (user_id, view_type, view_id)
  DO UPDATE SET
    sort_by = EXCLUDED.sort_by,
    sort_direction = EXCLUDED.sort_direction,
    view_mode = EXCLUDED.view_mode,
    manual_positions = EXCLUDED.manual_positions,
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 6. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION upsert_view_preference TO authenticated;

-- 7. Verify the setup
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'view_preferences'
ORDER BY ordinal_position;