-- Final fix for view_preferences to match frontend expectations
-- Apply this migration in Supabase SQL Editor

-- Drop the table and recreate with correct column names
DROP TABLE IF EXISTS view_preferences CASCADE;

-- Create view_preferences table with correct column names that match frontend
CREATE TABLE view_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    
    -- These column names must match what the frontend expects
    sort_by TEXT DEFAULT 'added',
    sort_direction TEXT DEFAULT 'desc' CHECK (sort_direction IN ('asc', 'desc')),
    view_mode TEXT DEFAULT 'list' CHECK (view_mode IN ('list', 'grid')),
    manual_positions JSONB DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, view_type, view_id)
);

-- Create indexes
CREATE INDEX idx_view_preferences_user ON view_preferences(user_id);
CREATE INDEX idx_view_preferences_view ON view_preferences(view_type, view_id);

-- Enable RLS
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON view_preferences;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences"
    ON view_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
    ON view_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
    ON view_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own preferences"
    ON view_preferences FOR DELETE
    USING (user_id = auth.uid());

-- Create the upsert function that the frontend expects
CREATE OR REPLACE FUNCTION upsert_view_preference(
    p_view_type TEXT,
    p_view_id TEXT,
    p_sort_by TEXT,
    p_sort_direction TEXT,
    p_view_mode TEXT,
    p_manual_positions JSONB
)
RETURNS void AS $$
BEGIN
    INSERT INTO view_preferences (
        user_id,
        view_type,
        view_id,
        sort_by,
        sort_direction,
        view_mode,
        manual_positions,
        updated_at
    )
    VALUES (
        auth.uid(),
        p_view_type,
        p_view_id,
        p_sort_by,
        p_sort_direction,
        p_view_mode,
        p_manual_positions,
        NOW()
    )
    ON CONFLICT (user_id, view_type, view_id)
    DO UPDATE SET
        sort_by = EXCLUDED.sort_by,
        sort_direction = EXCLUDED.sort_direction,
        view_mode = EXCLUDED.view_mode,
        manual_positions = EXCLUDED.manual_positions,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_view_preference TO authenticated;

-- Add comments
COMMENT ON TABLE view_preferences IS 'User preferences for different views';
COMMENT ON FUNCTION upsert_view_preference IS 'Upsert view preferences for the current user';

-- Verify the fix
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check that the correct columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'view_preferences' 
        AND column_name = 'sort_direction'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'SUCCESS: sort_direction column exists';
    ELSE
        RAISE NOTICE 'ERROR: sort_direction column missing!';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'view_preferences' 
        AND column_name = 'view_mode'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'SUCCESS: view_mode column exists';
    ELSE
        RAISE NOTICE 'ERROR: view_mode column missing!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Table recreated with correct column names.';
    RAISE NOTICE 'RPC function upsert_view_preference created.';
    RAISE NOTICE 'The 406 errors should now be resolved!';
END $$;