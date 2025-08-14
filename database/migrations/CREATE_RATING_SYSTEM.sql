-- CREATE RATING SYSTEM
-- Separate personal library ratings from playlist-specific ratings

-- 1. Personal track ratings (in user's library)
CREATE TABLE IF NOT EXISTS personal_track_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('listened', 'liked', 'loved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- 2. Playlist-specific ratings (for shared playlists)
CREATE TABLE IF NOT EXISTS playlist_track_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_track_id UUID NOT NULL REFERENCES playlist_tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('listened', 'liked', 'loved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_track_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE personal_track_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_track_ratings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for personal ratings
CREATE POLICY "Users can view own ratings" ON personal_track_ratings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own ratings" ON personal_track_ratings
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. RLS Policies for playlist ratings
-- Users can see all ratings in playlists they have access to
CREATE POLICY "Users can view playlist ratings" ON playlist_track_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      WHERE pt.id = playlist_track_ratings.playlist_track_id
      AND p.user_id = auth.uid()
    )
  );

-- Users can only manage their own playlist ratings
CREATE POLICY "Users can manage own playlist ratings" ON playlist_track_ratings
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Create view for aggregate playlist ratings
CREATE OR REPLACE VIEW playlist_track_rating_summary AS
SELECT 
  ptr.playlist_track_id,
  pt.track_id,
  pt.playlist_id,
  COUNT(CASE WHEN ptr.rating = 'listened' THEN 1 END) as listened_count,
  COUNT(CASE WHEN ptr.rating = 'liked' THEN 1 END) as liked_count,
  COUNT(CASE WHEN ptr.rating = 'loved' THEN 1 END) as loved_count,
  COUNT(ptr.rating) as total_ratings,
  ARRAY_AGG(
    jsonb_build_object(
      'user_id', ptr.user_id,
      'rating', ptr.rating,
      'user_email', p.email
    ) ORDER BY ptr.created_at
  ) as individual_ratings
FROM playlist_track_ratings ptr
JOIN playlist_tracks pt ON pt.id = ptr.playlist_track_id
JOIN profiles p ON p.id = ptr.user_id
GROUP BY ptr.playlist_track_id, pt.track_id, pt.playlist_id;

-- 7. Create indexes for performance
CREATE INDEX idx_personal_ratings_user_track ON personal_track_ratings(user_id, track_id);
CREATE INDEX idx_playlist_ratings_user_track ON playlist_track_ratings(user_id, playlist_track_id);
CREATE INDEX idx_playlist_ratings_playlist_track ON playlist_track_ratings(playlist_track_id);

-- 8. Test the setup
SELECT 
    'personal_track_ratings' as table_name,
    COUNT(*) as count
FROM personal_track_ratings
UNION ALL
SELECT 
    'playlist_track_ratings' as table_name,
    COUNT(*) as count
FROM playlist_track_ratings;

SELECT '✅ Rating system tables created successfully!' as status;