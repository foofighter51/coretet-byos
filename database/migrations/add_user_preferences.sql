-- Add user preferences for songwriter templates
-- Phase 1: Simple preferences to start

-- Add columns to profiles table for basic preferences
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS songwriter_type TEXT DEFAULT 'custom' 
  CHECK (songwriter_type IN ('guitarist', 'pianist', 'producer', 'vocalist', 'drummer', 'classical', 'custom')),
ADD COLUMN IF NOT EXISTS key_notation TEXT DEFAULT 'sharps' 
  CHECK (key_notation IN ('sharps', 'flats')),
ADD COLUMN IF NOT EXISTS show_tuning_field BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ui_preferences JSONB DEFAULT '{}';

-- Comments for clarity
COMMENT ON COLUMN profiles.songwriter_type IS 'Type of songwriter/musician for UI customization';
COMMENT ON COLUMN profiles.key_notation IS 'Preference for sharp or flat notation in keys';
COMMENT ON COLUMN profiles.show_tuning_field IS 'Whether to show tuning field in track details';
COMMENT ON COLUMN profiles.ui_preferences IS 'JSON storage for additional UI preferences';