-- This migration adapts the track_ratings table to work with authenticated users
-- while maintaining backward compatibility with the collaborator system

-- First, add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'track_ratings' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.track_ratings 
        ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_track_ratings_user_id ON public.track_ratings(user_id);

-- Remove the collaborator_id requirement constraint (make it nullable)
ALTER TABLE public.track_ratings 
ALTER COLUMN collaborator_id DROP NOT NULL;

-- Add a check constraint to ensure either user_id or collaborator_id is present
ALTER TABLE public.track_ratings DROP CONSTRAINT IF EXISTS check_has_rater;
ALTER TABLE public.track_ratings 
ADD CONSTRAINT check_has_rater 
CHECK (user_id IS NOT NULL OR collaborator_id IS NOT NULL);

-- Update the unique constraint to handle both user and collaborator ratings
ALTER TABLE public.track_ratings DROP CONSTRAINT IF EXISTS track_ratings_track_id_playlist_id_collaborator_id_key;
ALTER TABLE public.track_ratings DROP CONSTRAINT IF EXISTS track_ratings_unique_rating;

-- Create a new unique constraint that considers both user_id and collaborator_id
CREATE UNIQUE INDEX IF NOT EXISTS track_ratings_unique_rating 
ON public.track_ratings (track_id, playlist_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS track_ratings_unique_collaborator_rating 
ON public.track_ratings (track_id, playlist_id, collaborator_id) 
WHERE collaborator_id IS NOT NULL;

-- Add RLS policy for authenticated users to manage their own ratings
DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.track_ratings;

CREATE POLICY "Users can manage their own ratings" ON public.track_ratings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update the view policy to include user ratings
DROP POLICY IF EXISTS "Users can view ratings on their tracks" ON public.track_ratings;

CREATE POLICY "Users can view ratings on their tracks" ON public.track_ratings
  FOR SELECT
  USING (
    -- Main user can see all ratings on their playlists
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = track_ratings.playlist_id
      AND p.user_id = auth.uid()
    )
    OR
    -- Users can see ratings on playlists shared with them
    EXISTS (
      SELECT 1 FROM playlist_shares ps
      WHERE ps.playlist_id = track_ratings.playlist_id
      AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND ps.status = 'active'
    )
    OR
    -- Users can always see their own ratings
    track_ratings.user_id = auth.uid()
  );