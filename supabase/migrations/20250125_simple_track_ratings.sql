-- Simple approach: Create a user_track_ratings table specifically for authenticated users
-- This keeps it separate from the collaborator system

-- Create the user ratings table
CREATE TABLE IF NOT EXISTS public.user_track_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating text NOT NULL CHECK (rating IN ('listened', 'liked', 'loved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(track_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_track_ratings_track_id ON public.user_track_ratings(track_id);
CREATE INDEX IF NOT EXISTS idx_user_track_ratings_user_id ON public.user_track_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_track_ratings_rating ON public.user_track_ratings(rating);

-- Enable RLS
ALTER TABLE public.user_track_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view ratings on accessible tracks" ON public.user_track_ratings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      LEFT JOIN public.playlist_tracks pt ON pt.track_id = t.id
      LEFT JOIN public.playlists p ON p.id = pt.playlist_id
      WHERE user_track_ratings.track_id = t.id
      AND (
        t.user_id = auth.uid() OR
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM playlist_shares ps
          WHERE ps.playlist_id = p.id
          AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND ps.status = 'active'
        )
      )
    )
  );

CREATE POLICY "Users can manage their own ratings" ON public.user_track_ratings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_user_track_ratings_updated_at ON public.user_track_ratings;

CREATE TRIGGER handle_user_track_ratings_updated_at
  BEFORE UPDATE ON public.user_track_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();