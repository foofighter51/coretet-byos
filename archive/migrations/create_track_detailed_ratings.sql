-- Create track-level detailed ratings table
-- This is separate from section ratings for simpler track-level ratings
-- Created: 2025-08-12

CREATE TABLE IF NOT EXISTS track_detailed_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES rating_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, category_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_detailed_ratings_track ON track_detailed_ratings(track_id);
CREATE INDEX IF NOT EXISTS idx_track_detailed_ratings_user ON track_detailed_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_track_detailed_ratings_category ON track_detailed_ratings(category_id);

-- Enable RLS
ALTER TABLE track_detailed_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ratings for their tracks or their own ratings"
  ON track_detailed_ratings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR track_id IN (SELECT id FROM tracks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own ratings"
  ON track_detailed_ratings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ratings"
  ON track_detailed_ratings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own ratings"
  ON track_detailed_ratings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());