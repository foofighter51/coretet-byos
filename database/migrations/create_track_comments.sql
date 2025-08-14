-- Create track comments table for shared playlists
-- This allows users to comment on tracks within shared playlists

-- Create the track_comments table
CREATE TABLE IF NOT EXISTS track_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure uniqueness per track, playlist, user, and content
    -- This prevents duplicate comments
    UNIQUE(track_id, playlist_id, user_id, content)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_track_comments_track_playlist 
    ON track_comments(track_id, playlist_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_playlist 
    ON track_comments(playlist_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_user 
    ON track_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_created 
    ON track_comments(created_at DESC);

-- Enable RLS
ALTER TABLE track_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on playlists they have access to
CREATE POLICY "Users can view comments on accessible playlists"
    ON track_comments FOR SELECT
    USING (
        -- User owns the playlist
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = track_comments.playlist_id 
            AND playlists.user_id = auth.uid()
        )
        OR
        -- User has access to the shared playlist
        EXISTS (
            SELECT 1 FROM playlist_shares
            WHERE playlist_shares.playlist_id = track_comments.playlist_id
            AND playlist_shares.shared_with_email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
            AND playlist_shares.status = 'active'
        )
    );

-- Policy: Users can create comments on playlists they have access to
CREATE POLICY "Users can create comments on accessible playlists"
    ON track_comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            -- User owns the playlist
            EXISTS (
                SELECT 1 FROM playlists 
                WHERE playlists.id = playlist_id 
                AND playlists.user_id = auth.uid()
            )
            OR
            -- User has access to the shared playlist
            EXISTS (
                SELECT 1 FROM playlist_shares
                WHERE playlist_shares.playlist_id = playlist_id
                AND playlist_shares.shared_with_email = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
                AND playlist_shares.status = 'active'
            )
        )
    );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON track_comments FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON track_comments FOR DELETE
    USING (user_id = auth.uid());

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_track_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_track_comments_updated_at
    BEFORE UPDATE ON track_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_track_comment_updated_at();

-- Create view to get comments with user information
CREATE OR REPLACE VIEW track_comments_with_users AS
SELECT 
    tc.*,
    u.email as user_email,
    p.username as user_name,
    pl.name as playlist_name,
    t.name as track_name
FROM track_comments tc
JOIN auth.users u ON tc.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
JOIN playlists pl ON tc.playlist_id = pl.id
JOIN tracks t ON tc.track_id = t.id;

-- Grant access to the view
GRANT SELECT ON track_comments_with_users TO authenticated;