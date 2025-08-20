-- Migration: Create projects from existing tracks
-- This bridges the V1 tracks data to V2 projects structure

-- First, let's create projects from existing tracks
-- Each track becomes a project of type 'single'
INSERT INTO projects (
    id,
    user_id,
    name,
    artist,
    description,
    project_type,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    user_id,
    COALESCE(title, 'Untitled Work') as name,
    COALESCE(artist, 'Unknown Artist') as artist,
    COALESCE(description, '') as description,
    'single' as project_type,
    CASE 
        WHEN soft_deleted = true THEN 'archived'
        ELSE 'active'
    END as status,
    jsonb_build_object(
        'original_track_id', id,
        'genre', COALESCE(genre, ''),
        'bpm', COALESCE(bpm, 0),
        'key_signature', COALESCE(key_signature, ''),
        'time_signature', COALESCE(time_signature, ''),
        'tuning', COALESCE(tuning, ''),
        'track_category', COALESCE(category, 'songs'),
        'migrated_from_tracks', true
    ) as metadata,
    created_at,
    updated_at
FROM tracks 
WHERE soft_deleted = false OR soft_deleted IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create song_versions for each project (track)
-- Each track becomes the first version of its project
INSERT INTO song_versions (
    id,
    project_id,
    user_id,
    name,
    version_number,
    status,
    is_primary,
    metadata,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    p.id as project_id,
    t.user_id,
    COALESCE(t.title, 'Version 1.0') as name,
    '1.0.0' as version_number,
    'released' as status,
    true as is_primary,
    jsonb_build_object(
        'original_track_id', t.id,
        'file_path', t.file_path,
        'duration', COALESCE(t.duration, 0),
        'file_size', COALESCE(t.file_size, 0),
        'waveform_data', t.waveform_data,
        'storage_provider', COALESCE(t.storage_provider, 'supabase'),
        'provider_file_id', t.provider_file_id,
        'lyrics', COALESCE(t.lyrics, ''),
        'migrated_from_tracks', true
    ) as metadata,
    t.created_at,
    t.updated_at
FROM tracks t
JOIN projects p ON (p.metadata->>'original_track_id')::uuid = t.id
WHERE (t.soft_deleted = false OR t.soft_deleted IS NULL)
ON CONFLICT (id) DO NOTHING;

-- Create version_iterations for each song_version
-- Each track gets one iteration (the current file)
INSERT INTO version_iterations (
    id,
    version_id,
    user_id,
    iteration_number,
    name,
    is_current,
    file_path,
    file_size,
    duration,
    waveform_data,
    metadata,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    sv.id as version_id,
    t.user_id,
    1 as iteration_number,
    'Current Version' as name,
    true as is_current,
    t.file_path,
    COALESCE(t.file_size, 0) as file_size,
    COALESCE(t.duration, 0) as duration,
    t.waveform_data,
    jsonb_build_object(
        'original_track_id', t.id,
        'storage_provider', COALESCE(t.storage_provider, 'supabase'),
        'provider_file_id', t.provider_file_id,
        'upload_completed', true,
        'migrated_from_tracks', true
    ) as metadata,
    t.created_at,
    t.updated_at
FROM tracks t
JOIN projects p ON (p.metadata->>'original_track_id')::uuid = t.id
JOIN song_versions sv ON sv.project_id = p.id
WHERE (t.soft_deleted = false OR t.soft_deleted IS NULL)
ON CONFLICT (id) DO NOTHING;

-- Update statistics
SELECT 
    (SELECT COUNT(*) FROM projects WHERE metadata->>'migrated_from_tracks' = 'true') as projects_created,
    (SELECT COUNT(*) FROM song_versions WHERE metadata->>'migrated_from_tracks' = 'true') as versions_created,
    (SELECT COUNT(*) FROM version_iterations WHERE metadata->>'migrated_from_tracks' = 'true') as iterations_created;