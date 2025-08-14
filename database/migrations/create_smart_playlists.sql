-- Create smart playlists feature
-- Allows users to create dynamic playlists based on rating criteria
-- Apply this migration in Supabase SQL Editor

-- Create smart_playlists table
CREATE TABLE IF NOT EXISTS smart_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Stores the criteria for track selection
  is_active BOOLEAN DEFAULT true,
  max_tracks INTEGER, -- Optional limit on number of tracks
  sort_by TEXT DEFAULT 'created_at', -- How to sort matching tracks
  sort_order TEXT DEFAULT 'desc' CHECK (sort_order IN ('asc', 'desc')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example criteria JSON structure:
-- {
--   "ratings": {
--     "vibe": { "min": 2 },        -- vibe must be loved
--     "melody": { "min": 1 },       -- melody must be at least liked
--     "energy": { "min": 2 }        -- energy must be loved
--   },
--   "track_fields": {
--     "genre": ["Rock", "Alternative"],  -- must be one of these genres
--     "key": ["C Major", "G Major"],     -- must be in one of these keys
--     "tempo": { "min": 120, "max": 140 } -- BPM range
--   },
--   "general": {
--     "listened": true,             -- must be listened
--     "loved": true                  -- must be loved overall
--   }
-- }

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_smart_playlists_user ON smart_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_playlists_active ON smart_playlists(is_active);

-- Enable RLS
ALTER TABLE smart_playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own smart playlists"
  ON smart_playlists FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create smart playlists"
  ON smart_playlists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own smart playlists"
  ON smart_playlists FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own smart playlists"
  ON smart_playlists FOR DELETE
  USING (user_id = auth.uid());

-- Function to get tracks matching smart playlist criteria
CREATE OR REPLACE FUNCTION get_smart_playlist_tracks(
  p_playlist_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  track_id UUID,
  track_name TEXT,
  artist TEXT,
  genre TEXT,
  key TEXT,
  tempo INTEGER,
  listened BOOLEAN,
  liked BOOLEAN,
  loved BOOLEAN,
  match_score INTEGER
) AS $$
DECLARE
  v_criteria JSONB;
  v_max_tracks INTEGER;
  v_sort_by TEXT;
  v_sort_order TEXT;
  v_sql TEXT;
BEGIN
  -- Get playlist criteria
  SELECT criteria, max_tracks, sort_by, sort_order
  INTO v_criteria, v_max_tracks, v_sort_by, v_sort_order
  FROM smart_playlists
  WHERE id = p_playlist_id AND user_id = p_user_id AND is_active = true;
  
  IF v_criteria IS NULL THEN
    RETURN;
  END IF;
  
  -- Build dynamic query based on criteria
  RETURN QUERY
  WITH rated_tracks AS (
    SELECT 
      t.id,
      t.name,
      t.artist,
      t.genre,
      t.key,
      t.tempo,
      t.listened,
      t.liked,
      t.loved,
      -- Calculate match score based on how many criteria are met
      (
        CASE WHEN t.listened = COALESCE((v_criteria->'general'->>'listened')::boolean, t.listened) THEN 1 ELSE 0 END +
        CASE WHEN t.liked = COALESCE((v_criteria->'general'->>'liked')::boolean, t.liked) THEN 1 ELSE 0 END +
        CASE WHEN t.loved = COALESCE((v_criteria->'general'->>'loved')::boolean, t.loved) THEN 1 ELSE 0 END
      ) as base_score,
      -- Get rating scores
      (
        SELECT COUNT(*)
        FROM track_detailed_ratings tdr
        JOIN rating_categories rc ON rc.id = tdr.category_id
        WHERE tdr.track_id = t.id 
          AND tdr.user_id = p_user_id
          AND (
            -- Check each rating category in criteria
            (rc.name = 'vibe' AND tdr.rating_value >= COALESCE((v_criteria->'ratings'->'vibe'->>'min')::integer, 0)) OR
            (rc.name = 'lyrics' AND tdr.rating_value >= COALESCE((v_criteria->'ratings'->'lyrics'->>'min')::integer, 0)) OR
            (rc.name = 'melody' AND tdr.rating_value >= COALESCE((v_criteria->'ratings'->'melody'->>'min')::integer, 0)) OR
            (rc.name = 'progression' AND tdr.rating_value >= COALESCE((v_criteria->'ratings'->'progression'->>'min')::integer, 0)) OR
            (rc.name = 'rhythm' AND tdr.rating_value >= COALESCE((v_criteria->'ratings'->'rhythm'->>'min')::integer, 0)) OR
            (rc.name = 'energy' AND tdr.rating_value >= COALESCE((v_criteria->'ratings'->'energy'->>'min')::integer, 0))
          )
      ) as rating_score
    FROM tracks t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
      -- Apply track field filters
      AND (
        v_criteria->'track_fields'->'genre' IS NULL 
        OR t.genre = ANY(ARRAY(SELECT jsonb_array_elements_text(v_criteria->'track_fields'->'genre')))
      )
      AND (
        v_criteria->'track_fields'->'key' IS NULL 
        OR t.key = ANY(ARRAY(SELECT jsonb_array_elements_text(v_criteria->'track_fields'->'key')))
      )
      AND (
        v_criteria->'track_fields'->'tempo'->>'min' IS NULL 
        OR t.tempo >= (v_criteria->'track_fields'->'tempo'->>'min')::integer
      )
      AND (
        v_criteria->'track_fields'->'tempo'->>'max' IS NULL 
        OR t.tempo <= (v_criteria->'track_fields'->'tempo'->>'max')::integer
      )
  ),
  filtered_tracks AS (
    SELECT 
      rt.*,
      (rt.base_score + rt.rating_score) as total_score
    FROM rated_tracks rt
    WHERE 
      -- Must meet minimum rating requirements if specified
      (
        v_criteria->'ratings' IS NULL
        OR rt.rating_score >= jsonb_object_keys(v_criteria->'ratings')::integer * 0.5 -- At least half the criteria
      )
  )
  SELECT 
    id as track_id,
    name as track_name,
    artist,
    genre,
    key,
    tempo,
    listened,
    liked,
    loved,
    total_score as match_score
  FROM filtered_tracks
  ORDER BY 
    CASE WHEN v_sort_order = 'asc' THEN
      CASE v_sort_by
        WHEN 'name' THEN name
        WHEN 'artist' THEN artist
        WHEN 'genre' THEN genre
        ELSE name
      END
    END ASC,
    CASE WHEN v_sort_order = 'desc' THEN
      CASE v_sort_by
        WHEN 'name' THEN name
        WHEN 'artist' THEN artist
        WHEN 'genre' THEN genre
        ELSE name
      END
    END DESC,
    total_score DESC
  LIMIT v_max_tracks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a regular playlist from smart playlist results
CREATE OR REPLACE FUNCTION materialize_smart_playlist(
  p_smart_playlist_id UUID,
  p_playlist_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_playlist_id UUID;
  v_smart_name TEXT;
  v_playlist_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Get smart playlist name
  SELECT name INTO v_smart_name
  FROM smart_playlists
  WHERE id = p_smart_playlist_id AND user_id = v_user_id;
  
  IF v_smart_name IS NULL THEN
    RAISE EXCEPTION 'Smart playlist not found';
  END IF;
  
  -- Set playlist name
  v_playlist_name := COALESCE(p_playlist_name, v_smart_name || ' (Generated ' || TO_CHAR(NOW(), 'MM/DD') || ')');
  
  -- Create new regular playlist
  INSERT INTO playlists (user_id, name, description, created_at, updated_at)
  VALUES (
    v_user_id,
    v_playlist_name,
    'Generated from smart playlist: ' || v_smart_name,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_playlist_id;
  
  -- Add tracks to playlist
  INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
  SELECT 
    v_playlist_id,
    track_id,
    ROW_NUMBER() OVER (ORDER BY match_score DESC),
    NOW()
  FROM get_smart_playlist_tracks(p_smart_playlist_id, v_user_id);
  
  RETURN v_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE smart_playlists IS 'Dynamic playlists that automatically select tracks based on criteria';
COMMENT ON COLUMN smart_playlists.criteria IS 'JSON criteria for track selection including ratings, genres, keys, etc';
COMMENT ON FUNCTION get_smart_playlist_tracks IS 'Returns tracks matching smart playlist criteria';
COMMENT ON FUNCTION materialize_smart_playlist IS 'Creates a regular playlist from smart playlist results';

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Smart playlists feature created successfully!';
  RAISE NOTICE 'Users can now create dynamic playlists based on:';
  RAISE NOTICE '  - Rating criteria (vibe, melody, energy, etc)';
  RAISE NOTICE '  - Track properties (genre, key, tempo)';
  RAISE NOTICE '  - General status (listened, liked, loved)';
END $$;