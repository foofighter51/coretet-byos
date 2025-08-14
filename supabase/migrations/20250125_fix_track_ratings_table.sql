-- First, check if the track_ratings table exists and what columns it has
DO $$ 
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'track_ratings') THEN
        -- Check if user_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'track_ratings' AND column_name = 'user_id') THEN
            -- If table exists but user_id doesn't, we need to recreate it
            -- First drop existing policies
            DROP POLICY IF EXISTS "Users can view all ratings" ON public.track_ratings;
            DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.track_ratings;
            
            -- Drop the table
            DROP TABLE IF EXISTS public.track_ratings;
        END IF;
    END IF;
END $$;

-- Now create the table with the correct schema
CREATE TABLE IF NOT EXISTS public.track_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating text NOT NULL CHECK (rating IN ('listened', 'liked', 'loved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(track_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_track_ratings_track_id ON public.track_ratings(track_id);
CREATE INDEX IF NOT EXISTS idx_track_ratings_user_id ON public.track_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_track_ratings_rating ON public.track_ratings(rating);

-- Enable RLS
ALTER TABLE public.track_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all ratings" ON public.track_ratings;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.track_ratings;
DROP POLICY IF EXISTS "Users can view ratings on accessible tracks" ON public.track_ratings;

-- Create RLS policies
CREATE POLICY "Users can view ratings on accessible tracks" ON public.track_ratings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      LEFT JOIN public.playlist_tracks pt ON pt.track_id = t.id
      LEFT JOIN public.playlists p ON p.id = pt.playlist_id
      LEFT JOIN public.playlist_collaborators pc ON pc.playlist_id = p.id
      WHERE track_ratings.track_id = t.id
      AND (
        t.user_id = auth.uid() OR
        p.user_id = auth.uid() OR
        pc.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own ratings" ON public.track_ratings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS handle_track_ratings_updated_at ON public.track_ratings;

CREATE TRIGGER handle_track_ratings_updated_at
  BEFORE UPDATE ON public.track_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();