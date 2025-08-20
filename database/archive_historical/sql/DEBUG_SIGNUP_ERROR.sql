-- Debug the actual signup error

-- 1. Create a simple logging table to capture errors
CREATE TABLE IF NOT EXISTS auth_debug_log (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  message TEXT,
  details JSONB
);

-- 2. Create a minimal handle_new_user function with logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log the attempt
  INSERT INTO auth_debug_log (message, details)
  VALUES ('User creation attempt', jsonb_build_object(
    'user_id', new.id,
    'email', new.email,
    'email_confirmed_at', new.email_confirmed_at
  ));

  -- Try to create profile with minimal fields
  BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO auth_debug_log (message, details)
    VALUES ('Profile created successfully', jsonb_build_object('user_id', new.id));
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the trigger
      INSERT INTO auth_debug_log (message, details)
      VALUES ('Profile creation error', jsonb_build_object(
        'user_id', new.id,
        'error', SQLERRM,
        'detail', SQLSTATE
      ));
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Check recent errors
SELECT * FROM auth_debug_log ORDER BY created_at DESC LIMIT 10;

-- 5. Alternative: Completely remove the trigger temporarily
-- Uncomment these lines if you want to test signup without any triggers
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
SELECT 'All auth triggers removed - try signup now' as status;
*/