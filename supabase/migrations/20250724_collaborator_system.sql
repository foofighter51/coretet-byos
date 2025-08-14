-- Collaborator system for band/songwriter sharing

-- 1. Collaborators table (lightweight accounts)
CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 2. Playlist shares (who has access to what)
CREATE TABLE IF NOT EXISTS playlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'revoked')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  share_token UUID DEFAULT gen_random_uuid() UNIQUE,
  UNIQUE(playlist_id, shared_with_email)
);

-- 3. Track ratings from collaborators
CREATE TABLE IF NOT EXISTS track_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('listened', 'liked', 'loved')),
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, playlist_id, collaborator_id)
);

-- 4. Collaborator sessions (simple auth)
CREATE TABLE IF NOT EXISTS collaborator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlist_shares_playlist_id ON playlist_shares(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_shares_collaborator_id ON playlist_shares(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_track_ratings_track_id ON track_ratings(track_id);
CREATE INDEX IF NOT EXISTS idx_track_ratings_playlist_id ON track_ratings(playlist_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_sessions_token ON collaborator_sessions(token);
CREATE INDEX IF NOT EXISTS idx_collaborator_sessions_expires_at ON collaborator_sessions(expires_at);

-- Enable RLS
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborator_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Collaborators can view their own data
CREATE POLICY "Collaborators can view own profile" ON collaborators
  FOR SELECT USING (
    -- Either viewing your own profile
    id = current_setting('app.current_collaborator_id', true)::uuid
    OR
    -- Or you're a main user viewing collaborators on your shared playlists
    EXISTS (
      SELECT 1 FROM playlist_shares ps
      JOIN playlists p ON ps.playlist_id = p.id
      WHERE ps.collaborator_id = collaborators.id
      AND p.user_id = auth.uid()
    )
  );

-- Playlist shares - users can manage their own shares
CREATE POLICY "Users can view their playlist shares" ON playlist_shares
  FOR SELECT USING (
    -- Main user can see all shares for their playlists
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_shares.playlist_id
      AND p.user_id = auth.uid()
    )
    OR
    -- Collaborators can see shares they're part of
    collaborator_id = current_setting('app.current_collaborator_id', true)::uuid
  );

CREATE POLICY "Users can create playlist shares" ON playlist_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their playlist shares" ON playlist_shares
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_shares.playlist_id
      AND p.user_id = auth.uid()
    )
  );

-- Track ratings - transparent within shared playlists
CREATE POLICY "View ratings on shared playlists" ON track_ratings
  FOR SELECT USING (
    -- Main user can see all ratings on their playlists
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = track_ratings.playlist_id
      AND p.user_id = auth.uid()
    )
    OR
    -- Collaborators can see all ratings on playlists shared with them
    EXISTS (
      SELECT 1 FROM playlist_shares ps
      WHERE ps.playlist_id = track_ratings.playlist_id
      AND ps.collaborator_id = current_setting('app.current_collaborator_id', true)::uuid
      AND ps.status = 'active'
    )
  );

CREATE POLICY "Collaborators can rate tracks" ON track_ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlist_shares ps
      WHERE ps.playlist_id = playlist_id
      AND ps.collaborator_id = current_setting('app.current_collaborator_id', true)::uuid
      AND ps.status = 'active'
    )
  );

CREATE POLICY "Collaborators can update their ratings" ON track_ratings
  FOR UPDATE USING (
    collaborator_id = current_setting('app.current_collaborator_id', true)::uuid
  );

-- Function to get rating counts for a track
CREATE OR REPLACE FUNCTION get_track_rating_counts(
  p_track_id UUID,
  p_playlist_id UUID
) RETURNS JSON AS $$
  SELECT json_build_object(
    'listened', COUNT(*) FILTER (WHERE rating = 'listened'),
    'liked', COUNT(*) FILTER (WHERE rating = 'liked'),
    'loved', COUNT(*) FILTER (WHERE rating = 'loved'),
    'total_ratings', COUNT(*),
    'raters', json_agg(
      json_build_object(
        'name', c.name,
        'rating', tr.rating,
        'rated_at', tr.rated_at
      ) ORDER BY tr.rated_at DESC
    )
  )
  FROM track_ratings tr
  JOIN collaborators c ON tr.collaborator_id = c.id
  WHERE tr.track_id = p_track_id 
  AND tr.playlist_id = p_playlist_id;
$$ LANGUAGE SQL STABLE;

-- Function to validate share token
CREATE OR REPLACE FUNCTION validate_share_token(
  p_token UUID
) RETURNS TABLE (
  playlist_id UUID,
  playlist_name TEXT,
  shared_by UUID,
  shared_with_email TEXT,
  status TEXT
) AS $$
  SELECT 
    ps.playlist_id,
    p.name as playlist_name,
    ps.shared_by,
    ps.shared_with_email,
    ps.status
  FROM playlist_shares ps
  JOIN playlists p ON ps.playlist_id = p.id
  WHERE ps.share_token = p_token;
$$ LANGUAGE SQL STABLE;