# Manual Security Fix via Supabase Dashboard

If you can't run SQL migrations, do this immediately:

## 1. Make Storage Bucket Private
1. Go to Supabase Dashboard
2. Navigate to **Storage** → **audio-files**
3. Click **Policies** tab
4. Find and DELETE: "Public can view audio files"
5. Click **Settings** tab
6. UNCHECK "Public bucket"
7. Click **Save**

## 2. Fix Database Policies
1. Go to **Database** → **Tables**
2. Find the **tracks** table
3. Click **RLS Policies**
4. Find and DELETE: "Users can view tracks they have access to"
5. Keep only: "Users can view own tracks"

## 3. Verify the Fix
1. Log in as a different user
2. They should NOT see tracks from other users
3. They should only see tracks in playlists explicitly shared with them

## Running SQL Migrations
If SQL editor isn't working:
1. Try refreshing the page
2. Check you're in the SQL Editor section
3. Make sure you're connected to the right project
4. Try running smaller parts (I've split them into 5 parts above)

## Alternative: Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push --db-url "your-database-url"
```

The security issue is CRITICAL - all users can see all files until this is fixed!