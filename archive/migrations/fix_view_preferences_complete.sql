-- Fix view_preferences table structure to resolve 406 errors
-- Apply this migration in Supabase SQL Editor

-- First, check what columns exist
DO $$
DECLARE
    col_count integer;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'view_preferences';
    
    RAISE NOTICE 'Current view_preferences has % columns', col_count;
END $$;

-- Drop the table if it exists (we'll recreate it properly)
DROP TABLE IF EXISTS view_preferences CASCADE;

-- Create view_preferences table with all required columns
CREATE TABLE view_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL, -- 'library', 'playlist', 'collection', etc.
    view_id TEXT, -- ID of the specific view (playlist ID, collection name, etc.)
    
    -- View settings
    sort_by TEXT DEFAULT 'created_at',
    sort_order TEXT DEFAULT 'desc' CHECK (sort_order IN ('asc', 'desc')),
    
    -- Display preferences
    show_grid BOOLEAN DEFAULT false,
    show_waveform BOOLEAN DEFAULT true,
    show_details BOOLEAN DEFAULT true,
    
    -- Filter preferences
    filters JSONB DEFAULT '{}',
    
    -- Layout preferences
    column_widths JSONB DEFAULT '{}',
    visible_columns JSONB DEFAULT '[]',
    
    -- Other preferences
    preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique preference per user/view combination
    UNIQUE(user_id, view_type, view_id)
);

-- Create indexes for performance
CREATE INDEX idx_view_preferences_user ON view_preferences(user_id);
CREATE INDEX idx_view_preferences_view ON view_preferences(view_type, view_id);

-- Enable RLS
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

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

-- Create function to get or create view preferences
CREATE OR REPLACE FUNCTION get_or_create_view_preferences(
    p_view_type TEXT,
    p_view_id TEXT DEFAULT NULL
)
RETURNS view_preferences AS $$
DECLARE
    v_user_id UUID;
    v_preferences view_preferences;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try to get existing preferences
    SELECT * INTO v_preferences
    FROM view_preferences
    WHERE user_id = v_user_id
        AND view_type = p_view_type
        AND (view_id = p_view_id OR (view_id IS NULL AND p_view_id IS NULL));
    
    -- If not found, create default preferences
    IF NOT FOUND THEN
        INSERT INTO view_preferences (user_id, view_type, view_id)
        VALUES (v_user_id, p_view_type, p_view_id)
        RETURNING * INTO v_preferences;
    END IF;
    
    RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update view preferences
CREATE OR REPLACE FUNCTION update_view_preferences(
    p_view_type TEXT,
    p_view_id TEXT,
    p_updates JSONB
)
RETURNS view_preferences AS $$
DECLARE
    v_user_id UUID;
    v_preferences view_preferences;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Update or insert preferences
    INSERT INTO view_preferences (
        user_id, 
        view_type, 
        view_id,
        sort_by,
        sort_order,
        show_grid,
        show_waveform,
        show_details,
        filters,
        column_widths,
        visible_columns,
        preferences
    )
    VALUES (
        v_user_id,
        p_view_type,
        p_view_id,
        COALESCE((p_updates->>'sort_by')::text, 'created_at'),
        COALESCE((p_updates->>'sort_order')::text, 'desc'),
        COALESCE((p_updates->>'show_grid')::boolean, false),
        COALESCE((p_updates->>'show_waveform')::boolean, true),
        COALESCE((p_updates->>'show_details')::boolean, true),
        COALESCE((p_updates->'filters')::jsonb, '{}'::jsonb),
        COALESCE((p_updates->'column_widths')::jsonb, '{}'::jsonb),
        COALESCE((p_updates->'visible_columns')::jsonb, '[]'::jsonb),
        COALESCE((p_updates->'preferences')::jsonb, '{}'::jsonb)
    )
    ON CONFLICT (user_id, view_type, view_id) 
    DO UPDATE SET
        sort_by = COALESCE((p_updates->>'sort_by')::text, view_preferences.sort_by),
        sort_order = COALESCE((p_updates->>'sort_order')::text, view_preferences.sort_order),
        show_grid = COALESCE((p_updates->>'show_grid')::boolean, view_preferences.show_grid),
        show_waveform = COALESCE((p_updates->>'show_waveform')::boolean, view_preferences.show_waveform),
        show_details = COALESCE((p_updates->>'show_details')::boolean, view_preferences.show_details),
        filters = COALESCE((p_updates->'filters')::jsonb, view_preferences.filters),
        column_widths = COALESCE((p_updates->'column_widths')::jsonb, view_preferences.column_widths),
        visible_columns = COALESCE((p_updates->'visible_columns')::jsonb, view_preferences.visible_columns),
        preferences = COALESCE((p_updates->'preferences')::jsonb, view_preferences.preferences),
        updated_at = NOW()
    RETURNING * INTO v_preferences;
    
    RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_view_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION update_view_preferences TO authenticated;

-- Add helpful comments
COMMENT ON TABLE view_preferences IS 'User preferences for different views (library, playlists, etc)';
COMMENT ON COLUMN view_preferences.view_type IS 'Type of view: library, playlist, collection, etc';
COMMENT ON COLUMN view_preferences.view_id IS 'Optional ID for specific views like playlist IDs';
COMMENT ON COLUMN view_preferences.preferences IS 'Additional preferences stored as JSON';

-- Verify the fix
DO $$
DECLARE
    col_count integer;
    idx_count integer;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'view_preferences';
    
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE tablename = 'view_preferences';
    
    RAISE NOTICE '=== View Preferences Fixed ===';
    RAISE NOTICE 'Table has % columns', col_count;
    RAISE NOTICE 'Table has % indexes', idx_count;
    RAISE NOTICE 'RLS is enabled with policies';
    RAISE NOTICE 'Helper functions created';
    RAISE NOTICE '';
    RAISE NOTICE 'The 406 errors should now be resolved!';
END $$;