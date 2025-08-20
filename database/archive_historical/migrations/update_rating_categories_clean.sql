-- Update rating categories to be cleaner
-- Remove icons, descriptions, and unnecessary categories
-- Change to like/love system (1 = liked, 2 = loved)

-- First, delete production and originality categories
DELETE FROM rating_categories 
WHERE name IN ('production', 'originality') 
AND is_global = true;

-- Update existing categories to remove icons and descriptions
UPDATE rating_categories 
SET 
  icon = NULL,
  description = NULL,
  updated_at = NOW()
WHERE is_global = true;

-- Update the rating scale for all categories to use like/love
UPDATE rating_scales
SET 
  scale_type = 'multi_state',
  min_value = 1,
  max_value = 2,
  scale_labels = '{"1": "liked", "2": "loved"}',
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM rating_categories WHERE is_global = true
);

-- Update the constraint on track_detailed_ratings to allow only 1 or 2
ALTER TABLE track_detailed_ratings 
DROP CONSTRAINT IF EXISTS track_detailed_ratings_rating_value_check;

ALTER TABLE track_detailed_ratings 
ADD CONSTRAINT track_detailed_ratings_rating_value_check 
CHECK (rating_value IN (1, 2));

-- If you haven't created track_detailed_ratings yet, here's the updated version:
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

-- Add comment to explain the rating values
COMMENT ON COLUMN track_detailed_ratings.rating_value IS '1 = liked (thumbs up), 2 = loved (heart)';