-- Fix missing view_preferences table and display_name column
-- Also ensure all auth users have profile records

-- 1. Add display_name column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN display_name TEXT;
        RAISE NOTICE 'Added display_name column to profiles table';
    ELSE
        RAISE NOTICE 'display_name column already exists';
    END IF;
END $$;

-- 2. Create view_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_type, view_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_view_preferences_user_id ON view_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_view_preferences_view ON view_preferences(view_type, view_id);

-- Enable RLS
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for view_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON view_preferences;
CREATE POLICY "Users can view own preferences" ON view_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON view_preferences;
CREATE POLICY "Users can insert own preferences" ON view_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON view_preferences;
CREATE POLICY "Users can update own preferences" ON view_preferences
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON view_preferences;
CREATE POLICY "Users can delete own preferences" ON view_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT SELECT ON view_preferences TO anon;

-- 3. Ensure all auth users have profile records
DO $$
DECLARE
    auth_user RECORD;
    profile_exists BOOLEAN;
BEGIN
    -- Loop through all auth users
    FOR auth_user IN SELECT id, email, created_at FROM auth.users LOOP
        -- Check if profile exists
        SELECT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth_user.id
        ) INTO profile_exists;
        
        -- Create profile if it doesn't exist
        IF NOT profile_exists THEN
            INSERT INTO profiles (
                id, 
                email, 
                display_name,
                storage_used, 
                storage_limit, 
                is_active,
                created_at
            ) VALUES (
                auth_user.id,
                auth_user.email,
                SPLIT_PART(auth_user.email, '@', 1), -- Use email prefix as default display name
                0,
                10737418240, -- 10GB default
                true,
                auth_user.created_at
            ) ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Created profile for user: %', auth_user.email;
        END IF;
    END LOOP;
END $$;

-- 4. Update existing profiles to have display_name if null
UPDATE profiles 
SET display_name = COALESCE(display_name, SPLIT_PART(email, '@', 1))
WHERE display_name IS NULL;

-- 5. Ensure profiles table has all necessary columns
DO $$
BEGIN
    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to profiles table';
    END IF;
    
    -- Add storage_used if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'storage_used'
    ) THEN
        ALTER TABLE profiles ADD COLUMN storage_used BIGINT DEFAULT 0;
        RAISE NOTICE 'Added storage_used column to profiles table';
    END IF;
    
    -- Add storage_limit if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'storage_limit'
    ) THEN
        ALTER TABLE profiles ADD COLUMN storage_limit BIGINT DEFAULT 10737418240; -- 10GB
        RAISE NOTICE 'Added storage_limit column to profiles table';
    END IF;
    
    -- Add invited_by if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'invited_by'
    ) THEN
        ALTER TABLE profiles ADD COLUMN invited_by UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added invited_by column to profiles table';
    END IF;
END $$;

-- 6. Ensure RLS policies exist for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow viewing basic profile info for playlist sharing
DROP POLICY IF EXISTS "Users can view profiles for sharing" ON profiles;
CREATE POLICY "Users can view profiles for sharing" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlist_shares
            WHERE (shared_by = profiles.id OR LOWER(shared_with_email) = LOWER(profiles.email))
            AND (shared_by = auth.uid() OR LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())))
        )
    );

-- 7. Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        display_name,
        storage_used, 
        storage_limit, 
        is_active,
        created_at
    ) VALUES (
        NEW.id,
        NEW.email,
        SPLIT_PART(NEW.email, '@', 1),
        0,
        10737418240, -- 10GB default
        true,
        NEW.created_at
    ) ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Verify specific user (ericexley@hotmail.com)
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_id FROM auth.users WHERE email = 'ericexley@hotmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Ensure profile exists
        INSERT INTO profiles (
            id, 
            email, 
            display_name,
            storage_used, 
            storage_limit, 
            is_active,
            created_at
        ) VALUES (
            user_id,
            'ericexley@hotmail.com',
            'ericexley',
            0,
            10737418240,
            true,
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            is_active = true,
            display_name = COALESCE(profiles.display_name, 'ericexley');
            
        RAISE NOTICE 'Verified/created profile for ericexley@hotmail.com';
    ELSE
        RAISE NOTICE 'User ericexley@hotmail.com not found in auth.users';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed profiles table structure';
    RAISE NOTICE '✅ Created view_preferences table';
    RAISE NOTICE '✅ Ensured all users have profiles';
    RAISE NOTICE '✅ Added display_name column';
    RAISE NOTICE '✅ Set up automatic profile creation for new users';
END $$;