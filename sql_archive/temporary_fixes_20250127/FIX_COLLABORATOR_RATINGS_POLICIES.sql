-- FIX COLLABORATOR-BASED TRACK RATINGS POLICIES
-- This handles the track_ratings table that uses collaborator_id

-- Drop existing policies on track_ratings
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'track_ratings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON track_ratings', pol.policyname);
    END LOOP;
END $$;

-- =====================================================
-- TRACK_RATINGS POLICIES FOR COLLABORATOR SYSTEM
-- =====================================================

-- For the collaborator-based system, we need different policies
-- since ratings are tied to collaborator sessions, not auth users

-- 1. Playlist owners can view all ratings on their playlists
CREATE POLICY "Playlist owners can view ratings" ON track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = track_ratings.playlist_id
            AND p.user_id = auth.uid()
        )
    );

-- 2. For now, skip collaborator-specific policies since they use a different auth system
-- The collaborator auth is handled separately from Supabase Auth

-- =====================================================
-- ALTERNATIVE: Convert to User-Based Ratings
-- =====================================================

-- If you want to allow regular authenticated users (not collaborators) to rate tracks,
-- you might need to either:
-- 1. Add a user_id column to track_ratings table
-- 2. Create a separate user_track_ratings table
-- 3. Link collaborators to auth.users

-- For now, let's check if there's a user_track_ratings table that might be more appropriate:
SELECT 
    table_name,
    string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name LIKE '%rating%'
GROUP BY table_name;

-- =====================================================
-- WORKAROUND: Simple Policy for Testing
-- =====================================================

-- Allow authenticated users to view ratings in playlists they can access
CREATE POLICY "Users can view ratings in accessible playlists" ON track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = track_ratings.playlist_id
            AND (
                p.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND ps.shared_with_email = auth.jwt()->>'email'
                    AND ps.status = 'active'
                )
            )
        )
    );

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'track_ratings'
ORDER BY policyname;

-- =====================================================
-- RECOMMENDATION
-- =====================================================

/*
The current track_ratings table is designed for a separate collaborator authentication system,
not the main Supabase Auth system. 

Options:
1. Use the collaborator system as designed (separate login for collaborators)
2. Migrate to a user-based rating system using auth.users
3. Create a link between collaborators and auth.users

For option 2, you could create a new table:
*/

-- Example structure for user-based ratings:
/*
CREATE TABLE IF NOT EXISTS user_track_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating TEXT NOT NULL CHECK (rating IN ('listened', 'liked', 'loved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(track_id, user_id)
);

-- Then create proper RLS policies for this table
*/