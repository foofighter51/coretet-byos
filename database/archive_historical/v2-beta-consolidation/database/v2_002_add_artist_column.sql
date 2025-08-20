-- Add artist column to projects table for songwriter workflow
-- This allows users to specify the artist/band name when creating a work

-- Add artist column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'artist'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN artist TEXT;
        
        COMMENT ON COLUMN public.projects.artist IS 'Artist or band name for the work';
    END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Force schema cache reload
SELECT pg_notify('pgrst', 'reload schema');