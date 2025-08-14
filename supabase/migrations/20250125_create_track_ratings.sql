-- Create track_ratings table if it doesn't exist
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

-- Create RLS policies
CREATE POLICY "Users can view all ratings" ON public.track_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own ratings" ON public.track_ratings
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

CREATE TRIGGER handle_track_ratings_updated_at
  BEFORE UPDATE ON public.track_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();