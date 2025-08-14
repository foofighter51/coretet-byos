-- Safe Rating Categories Migration
-- Only creates tables and indexes if they don't exist

-- 1. Rating Categories Table
CREATE TABLE IF NOT EXISTS rating_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rating_categories_name_created_by_track_id_key'
  ) THEN
    ALTER TABLE rating_categories 
    ADD CONSTRAINT rating_categories_name_created_by_track_id_key 
    UNIQUE(name, created_by, track_id);
  END IF;
END $$;

-- 2. Rating Scales Table
CREATE TABLE IF NOT EXISTS rating_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES rating_categories(id) ON DELETE CASCADE,
  scale_type TEXT NOT NULL CHECK (scale_type IN ('numeric', 'descriptive', 'binary', 'multi_state')),
  min_value INTEGER DEFAULT 1,
  max_value INTEGER DEFAULT 5,
  scale_labels JSONB,
  default_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_rating_categories_track ON rating_categories(track_id);
CREATE INDEX IF NOT EXISTS idx_rating_categories_created_by ON rating_categories(created_by);
CREATE INDEX IF NOT EXISTS idx_rating_categories_global ON rating_categories(is_global);
CREATE INDEX IF NOT EXISTS idx_rating_scales_category ON rating_scales(category_id);

-- Enable RLS
ALTER TABLE rating_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_scales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rating_categories
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own categories" ON rating_categories;
  DROP POLICY IF EXISTS "Users can view global categories" ON rating_categories;
  DROP POLICY IF EXISTS "Users can create categories" ON rating_categories;
  DROP POLICY IF EXISTS "Users can update their own categories" ON rating_categories;
  DROP POLICY IF EXISTS "Users can delete their own categories" ON rating_categories;
  
  -- Create new policies
  CREATE POLICY "Users can view their own categories"
    ON rating_categories FOR SELECT
    TO authenticated
    USING (created_by = auth.uid() OR is_global = true);

  CREATE POLICY "Users can create categories"
    ON rating_categories FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

  CREATE POLICY "Users can update their own categories"
    ON rating_categories FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

  CREATE POLICY "Users can delete their own categories"
    ON rating_categories FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());
END $$;

-- RLS Policies for rating_scales
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view scales for accessible categories" ON rating_scales;
  DROP POLICY IF EXISTS "Users can create scales for their categories" ON rating_scales;
  DROP POLICY IF EXISTS "Users can update scales for their categories" ON rating_scales;
  DROP POLICY IF EXISTS "Users can delete scales for their categories" ON rating_scales;
  
  -- Create new policies
  CREATE POLICY "Users can view scales for accessible categories"
    ON rating_scales FOR SELECT
    TO authenticated
    USING (
      category_id IN (
        SELECT id FROM rating_categories 
        WHERE created_by = auth.uid() OR is_global = true
      )
    );

  CREATE POLICY "Users can create scales for their categories"
    ON rating_scales FOR INSERT
    TO authenticated
    WITH CHECK (
      category_id IN (
        SELECT id FROM rating_categories WHERE created_by = auth.uid()
      )
    );

  CREATE POLICY "Users can update scales for their categories"
    ON rating_scales FOR UPDATE
    TO authenticated
    USING (
      category_id IN (
        SELECT id FROM rating_categories WHERE created_by = auth.uid()
      )
    );

  CREATE POLICY "Users can delete scales for their categories"
    ON rating_scales FOR DELETE
    TO authenticated
    USING (
      category_id IN (
        SELECT id FROM rating_categories WHERE created_by = auth.uid()
      )
    );
END $$;

-- Insert default categories if they don't exist
INSERT INTO rating_categories (name, description, is_global, display_order, created_by)
SELECT name, description, true, display_order, auth.uid()
FROM (VALUES
  ('vibe', 'Overall feeling and atmosphere', 1),
  ('lyrics', 'Quality and impact of lyrics', 2),
  ('melody', 'Melodic composition and catchiness', 3),
  ('progression', 'Chord progression and harmonic movement', 4),
  ('rhythm', 'Rhythmic feel and groove', 5),
  ('energy', 'Energy level and intensity', 6)
) AS default_cats(name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM rating_categories WHERE name = default_cats.name AND is_global = true
);

-- Create default numeric scales for each category
INSERT INTO rating_scales (category_id, scale_type, min_value, max_value)
SELECT id, 'binary', 1, 2
FROM rating_categories
WHERE is_global = true
AND NOT EXISTS (
  SELECT 1 FROM rating_scales WHERE category_id = rating_categories.id
);

-- Add comments
COMMENT ON TABLE rating_categories IS 'Custom rating categories for tracks and sections';
COMMENT ON TABLE rating_scales IS 'Rating scale definitions for each category';