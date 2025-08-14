-- Update RLS policies to allow collaborators to view playlist tracks

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their playlist tracks" ON public.playlist_tracks;

-- Create new policy that allows both owners and collaborators to view
CREATE POLICY "Users can view playlist tracks they have access to" ON public.playlist_tracks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND (
        playlists.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.playlist_collaborators
          WHERE playlist_collaborators.playlist_id = playlists.id
          AND playlist_collaborators.user_id = auth.uid()
        )
      )
    )
  );

-- Update tracks policy to allow collaborators to view tracks in shared playlists
DROP POLICY IF EXISTS "Users can view tracks in their playlists" ON public.tracks;

CREATE POLICY "Users can view tracks they have access to" ON public.tracks
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.playlist_tracks pt
      JOIN public.playlists p ON p.id = pt.playlist_id
      LEFT JOIN public.playlist_collaborators pc ON pc.playlist_id = p.id
      WHERE pt.track_id = tracks.id
      AND (p.user_id = auth.uid() OR pc.user_id = auth.uid())
    )
  );

-- Ensure collaborators can view ratings in shared playlists
DROP POLICY IF EXISTS "Users can view all ratings" ON public.track_ratings;

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