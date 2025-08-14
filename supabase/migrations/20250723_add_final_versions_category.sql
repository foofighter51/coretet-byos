-- Update the category check constraint to include 'final-versions'
ALTER TABLE tracks 
DROP CONSTRAINT tracks_category_check;

ALTER TABLE tracks 
ADD CONSTRAINT tracks_category_check 
CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos', 'final-versions'));