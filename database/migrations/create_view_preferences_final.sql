-- Create view_preferences table to fix 406 errors
-- This table stores user preferences for different views in the app

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS view_preferences CASCADE;

-- Create the table
CREATE TABLE view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_type, view_id)
);

-- Create indexes
CREATE INDEX idx_view_preferences_user_id ON view_preferences(user_id);
CREATE INDEX idx_view_preferences_view ON view_preferences(view_type, view_id);

-- Enable RLS
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own preferences" ON view_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON view_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON view_preferences
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON view_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT SELECT ON view_preferences TO anon;

-- Insert default preferences for existing users
INSERT INTO view_preferences (user_id, view_type, view_id, preferences)
SELECT 
    id as user_id,
    'category' as view_type,
    'all' as view_id,
    '{"sortBy": "updated_at", "sortOrder": "desc", "viewMode": "list"}'::jsonb as preferences
FROM auth.users
ON CONFLICT (user_id, view_type, view_id) DO NOTHING;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_view_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_view_preferences_updated_at_trigger ON view_preferences;
CREATE TRIGGER update_view_preferences_updated_at_trigger
    BEFORE UPDATE ON view_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_view_preferences_updated_at();

-- Verify the table was created
SELECT 
    'view_preferences table created' as status,
    COUNT(*) as row_count
FROM view_preferences;

-- Show sample data
SELECT 
    vp.user_id,
    au.email,
    vp.view_type,
    vp.view_id,
    vp.preferences
FROM view_preferences vp
JOIN auth.users au ON vp.user_id = au.id
LIMIT 5;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ view_preferences table created successfully';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Default preferences added for all users';
    RAISE NOTICE '';
    RAISE NOTICE 'This fixes the 406 errors when the app tries to load preferences.';
END $$;