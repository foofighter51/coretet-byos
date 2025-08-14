-- Custom Rating System Migration
-- Phase 1: Core Infrastructure for Custom Ratings
-- Created: 2025-08-12

-- 1. Rating Categories Table
-- Defines custom rating categories that users can create (vibe, lyrics, melody, etc.)
CREATE TABLE IF NOT EXISTS rating_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Optional icon/emoji for the category
  color TEXT, -- Hex color for visual representation
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE, -- Can be track-specific
  is_global BOOLEAN DEFAULT false, -- If true, available to all users
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, created_by, track_id)
);

-- 2. Rating Scales Table
-- Defines different scale types (numeric, descriptive, etc.)
CREATE TABLE IF NOT EXISTS rating_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES rating_categories(id) ON DELETE CASCADE,
  scale_type TEXT NOT NULL CHECK (scale_type IN ('numeric', 'descriptive', 'binary', 'multi_state')),
  min_value INTEGER DEFAULT 1,
  max_value INTEGER DEFAULT 5,
  scale_labels JSONB, -- For descriptive scales: {"1": "too slow", "2": "good", "3": "too fast"}
  default_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Section Ratings Table
-- Stores actual ratings for audio sections
CREATE TABLE IF NOT EXISTS section_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES audio_sections(id) ON DELETE CASCADE,
  category_id UUID REFERENCES rating_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_value INTEGER,
  rating_text TEXT, -- For descriptive ratings
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, category_id, user_id)
);

-- 4. Track Rating Schemes Table
-- Links tracks to sets of rating categories
CREATE TABLE IF NOT EXISTS track_rating_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Can other users use this scheme
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Track Rating Scheme Categories Junction Table
CREATE TABLE IF NOT EXISTS track_rating_scheme_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID REFERENCES track_rating_schemes(id) ON DELETE CASCADE,
  category_id UUID REFERENCES rating_categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scheme_id, category_id)
);

-- 6. Section Rating Aggregates Table (for performance)
CREATE TABLE IF NOT EXISTS section_rating_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES audio_sections(id) ON DELETE CASCADE,
  category_id UUID REFERENCES rating_categories(id) ON DELETE CASCADE,
  avg_rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,
  rating_distribution JSONB, -- {"1": 5, "2": 10, "3": 15, etc.}
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, category_id)
);

-- Indexes for performance
CREATE INDEX idx_rating_categories_track ON rating_categories(track_id);
CREATE INDEX idx_rating_categories_created_by ON rating_categories(created_by);
CREATE INDEX idx_section_ratings_section ON section_ratings(section_id);
CREATE INDEX idx_section_ratings_user ON section_ratings(user_id);
CREATE INDEX idx_section_ratings_category ON section_ratings(category_id);
CREATE INDEX idx_track_rating_schemes_track ON track_rating_schemes(track_id);
CREATE INDEX idx_section_rating_aggregates_section ON section_rating_aggregates(section_id);

-- Row Level Security Policies

-- Rating Categories RLS
ALTER TABLE rating_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own and global rating categories"
  ON rating_categories FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR is_global = true
    OR track_id IN (
      SELECT id FROM tracks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rating categories"
  ON rating_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      track_id IS NULL 
      OR track_id IN (SELECT id FROM tracks WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own rating categories"
  ON rating_categories FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own rating categories"
  ON rating_categories FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Rating Scales RLS
ALTER TABLE rating_scales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rating scales for accessible categories"
  ON rating_scales FOR SELECT
  TO authenticated
  USING (
    category_id IN (
      SELECT id FROM rating_categories 
      WHERE created_by = auth.uid() 
      OR is_global = true
      OR track_id IN (SELECT id FROM tracks WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage rating scales for their categories"
  ON rating_scales FOR ALL
  TO authenticated
  USING (
    category_id IN (
      SELECT id FROM rating_categories WHERE created_by = auth.uid()
    )
  );

-- Section Ratings RLS
ALTER TABLE section_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view section ratings"
  ON section_ratings FOR SELECT
  TO authenticated
  USING (
    section_id IN (
      SELECT id FROM audio_sections 
      WHERE track_id IN (
        SELECT id FROM tracks WHERE user_id = auth.uid()
      )
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create their own section ratings"
  ON section_ratings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own section ratings"
  ON section_ratings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own section ratings"
  ON section_ratings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Track Rating Schemes RLS
ALTER TABLE track_rating_schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rating schemes"
  ON track_rating_schemes FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR is_public = true
    OR track_id IN (SELECT id FROM tracks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create rating schemes for their tracks"
  ON track_rating_schemes FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND track_id IN (SELECT id FROM tracks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own rating schemes"
  ON track_rating_schemes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own rating schemes"
  ON track_rating_schemes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Track Rating Scheme Categories RLS
ALTER TABLE track_rating_scheme_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scheme categories"
  ON track_rating_scheme_categories FOR SELECT
  TO authenticated
  USING (
    scheme_id IN (
      SELECT id FROM track_rating_schemes
      WHERE created_by = auth.uid()
      OR is_public = true
      OR track_id IN (SELECT id FROM tracks WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage their scheme categories"
  ON track_rating_scheme_categories FOR ALL
  TO authenticated
  USING (
    scheme_id IN (
      SELECT id FROM track_rating_schemes WHERE created_by = auth.uid()
    )
  );

-- Section Rating Aggregates RLS
ALTER TABLE section_rating_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view aggregates for accessible sections"
  ON section_rating_aggregates FOR SELECT
  TO authenticated
  USING (
    section_id IN (
      SELECT id FROM audio_sections
      WHERE track_id IN (
        SELECT id FROM tracks WHERE user_id = auth.uid()
      )
    )
  );

-- Functions for rating operations

-- Function to update rating aggregates
CREATE OR REPLACE FUNCTION update_section_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate new aggregate for the section/category combination
  INSERT INTO section_rating_aggregates (
    section_id,
    category_id,
    avg_rating,
    total_ratings,
    rating_distribution,
    last_calculated
  )
  SELECT
    COALESCE(NEW.section_id, OLD.section_id),
    COALESCE(NEW.category_id, OLD.category_id),
    AVG(rating_value)::DECIMAL(3,2),
    COUNT(*),
    jsonb_object_agg(rating_value::TEXT, count) AS rating_distribution,
    NOW()
  FROM (
    SELECT 
      rating_value,
      COUNT(*) as count
    FROM section_ratings
    WHERE section_id = COALESCE(NEW.section_id, OLD.section_id)
      AND category_id = COALESCE(NEW.category_id, OLD.category_id)
      AND rating_value IS NOT NULL
    GROUP BY rating_value
  ) AS ratings_grouped
  ON CONFLICT (section_id, category_id)
  DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    total_ratings = EXCLUDED.total_ratings,
    rating_distribution = EXCLUDED.rating_distribution,
    last_calculated = EXCLUDED.last_calculated;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update aggregates when ratings change
CREATE TRIGGER update_section_rating_aggregate_trigger
AFTER INSERT OR UPDATE OR DELETE ON section_ratings
FOR EACH ROW
EXECUTE FUNCTION update_section_rating_aggregate();

-- Function to get sections with specific rating criteria
CREATE OR REPLACE FUNCTION get_sections_by_rating(
  p_category_name TEXT,
  p_min_rating INTEGER DEFAULT NULL,
  p_rating_value INTEGER DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  section_id UUID,
  track_id UUID,
  section_name TEXT,
  start_time DECIMAL,
  end_time DECIMAL,
  avg_rating DECIMAL,
  user_rating INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS section_id,
    s.track_id,
    s.name AS section_name,
    s.start_time,
    s.end_time,
    a.avg_rating,
    r.rating_value AS user_rating
  FROM audio_sections s
  INNER JOIN rating_categories c ON c.name = p_category_name
  LEFT JOIN section_rating_aggregates a ON a.section_id = s.id AND a.category_id = c.id
  LEFT JOIN section_ratings r ON r.section_id = s.id 
    AND r.category_id = c.id 
    AND r.user_id = COALESCE(p_user_id, auth.uid())
  WHERE 
    (p_min_rating IS NULL OR a.avg_rating >= p_min_rating)
    AND (p_rating_value IS NULL OR r.rating_value = p_rating_value)
    AND s.track_id IN (SELECT id FROM tracks WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some default global rating categories
INSERT INTO rating_categories (name, description, icon, color, is_global, display_order)
VALUES 
  ('vibe', 'Overall feeling and atmosphere', '✨', '#9333ea', true, 1),
  ('lyrics', 'Quality and impact of lyrics', '📝', '#3b82f6', true, 2),
  ('melody', 'Melodic composition and catchiness', '🎵', '#10b981', true, 3),
  ('progression', 'Chord progression and harmonic movement', '🎸', '#f59e0b', true, 4),
  ('rhythm', 'Rhythmic feel and groove', '🥁', '#ef4444', true, 5),
  ('production', 'Production quality and mix', '🎛️', '#6366f1', true, 6),
  ('energy', 'Energy level and intensity', '⚡', '#f97316', true, 7),
  ('originality', 'Uniqueness and creativity', '💡', '#06b6d4', true, 8)
ON CONFLICT DO NOTHING;

-- Create default numeric scales for global categories
INSERT INTO rating_scales (category_id, scale_type, min_value, max_value)
SELECT id, 'numeric', 1, 5
FROM rating_categories
WHERE is_global = true
ON CONFLICT DO NOTHING;