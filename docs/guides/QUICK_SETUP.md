# Quick BYOS Setup Guide

## Database Setup Required

Since this is a new Supabase project, you need to set up the database schema first.

### Step 1: Run BYOS Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the entire contents of `/database/migrations/20250814_add_byos_support.sql`
3. Paste and run the migration

### Step 2: Create Admin User (Option A)

After migration, create your first admin user:

```sql
-- Create admin user (replace with your email)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'your-email@example.com', now(), now(), now());

-- Get the user ID (run this to see your user)
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Insert profile and set as admin (replace USER_ID with actual ID from above)
INSERT INTO profiles (id, email, is_active) 
VALUES ('USER_ID_FROM_ABOVE', 'your-email@example.com', true);

-- Create invite for yourself
INSERT INTO invites (code, expires_at, created_at)
VALUES ('ADMIN123', now() + interval '30 days', now());
```

### Step 3: Sign Up (Option B - Easier)

1. Visit http://localhost:5174/
2. Click "Sign Up"
3. Use invite code: `ADMIN123` (or whatever you set)
4. Create your account

### Step 4: Alternative - Simple Auth Setup

If you want to skip invite codes for development:

```sql
-- Disable email confirmation (development only)
UPDATE auth.config 
SET value = 'false' 
WHERE parameter = 'enable_email_confirmations';

-- Allow public signups (development only)
UPDATE auth.config 
SET value = 'true' 
WHERE parameter = 'enable_signup';
```

Then just sign up normally without invite code.

### Step 5: Verify Setup

After signing up, you should see:
- Storage Settings page accessible
- Supabase provider showing as connected
- Mock Google Drive provider available for connection

---

**Next**: Test the storage settings functionality and proceed with Google OAuth implementation!