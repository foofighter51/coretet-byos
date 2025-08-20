-- Create track comments table
CREATE TABLE IF NOT EXISTS track_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_comments_track ON track_comments(track_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_user ON track_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_created ON track_comments(created_at DESC);

-- Enable RLS
ALTER TABLE track_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Users can view comments on their tracks or tracks they have access to"
  ON track_comments FOR SELECT
  TO authenticated
  USING (
    track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
    )
    OR track_id IN (
      SELECT track_id FROM playlist_tracks pt
      JOIN playlists p ON pt.playlist_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments"
  ON track_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON track_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON track_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create track_detailed_ratings table (for the like/love system)
CREATE TABLE IF NOT EXISTS track_detailed_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES rating_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_value INTEGER CHECK (rating_value IN (1, 2)), -- 1 = liked, 2 = loved
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, category_id, user_id)
);

-- Indexes for track_detailed_ratings
CREATE INDEX IF NOT EXISTS idx_track_detailed_ratings_track ON track_detailed_ratings(track_id);
CREATE INDEX IF NOT EXISTS idx_track_detailed_ratings_user ON track_detailed_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_track_detailed_ratings_category ON track_detailed_ratings(category_id);

-- Enable RLS for track_detailed_ratings
ALTER TABLE track_detailed_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for track_detailed_ratings
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

-- Add comments
COMMENT ON TABLE track_comments IS 'Comments on tracks from collaborators and playlist members';
COMMENT ON COLUMN track_detailed_ratings.rating_value IS '1 = liked (thumbs up), 2 = loved (heart)';