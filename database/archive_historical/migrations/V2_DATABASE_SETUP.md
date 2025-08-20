# 📋 V2 Database Setup - Step by Step

## ⚠️ IMPORTANT: Read First!
This will add NEW tables to your database without affecting existing data. Your current tracks, playlists, and users remain untouched.

## Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Click on your CoreTet project
3. In the left sidebar, click **"SQL Editor"** (looks like </>)

## Step 2: Create a New Query

1. Click the **"+ New query"** button (usually green)
2. Name it: "V2 Project Schema"
3. You'll see a blank text area

## Step 3: Copy the Migration Script

1. Open the file: `database/migrations/v2_001_create_projects.sql`
2. Select ALL the text (Cmd+A on Mac, Ctrl+A on Windows)
3. Copy it (Cmd+C on Mac, Ctrl+C on Windows)

## Step 4: Paste and Review

1. Go back to Supabase SQL Editor
2. Paste the script into the text area
3. **Quick check**: The script should start with:
   ```sql
   -- CoreTet V2: Project Hierarchy Schema
   ```

## Step 5: Run the Migration

1. Click the **"Run"** button (usually green, bottom right)
2. Wait for it to complete (about 5-10 seconds)
3. You should see: **"Success. No rows returned"**

## Step 6: Verify the Tables Were Created

1. In the left sidebar, click **"Table Editor"**
2. You should now see these NEW tables:
   - `projects`
   - `song_versions`
   - `version_iterations`
   - `project_collaborators`
   - `version_metadata`
3. Your existing tables are still there:
   - `tracks` (with 3 new optional columns added)
   - `playlists` (unchanged)
   - `profiles` (unchanged)

## ✅ Success Indicators

If everything worked:
- ✅ "Success. No rows returned" message
- ✅ 5 new tables in Table Editor
- ✅ No error messages in red
- ✅ Your existing data is unchanged

## 🆘 If Something Goes Wrong

### "Error: relation already exists"
- This means you already ran the script
- It's safe - nothing was changed
- Continue to next steps

### "Error: permission denied"
- Make sure you're in the SQL Editor
- Not the SQL command line at the bottom

### Want to Undo Everything?
1. Create a new query
2. Paste this rollback script:
```sql
-- ROLLBACK V2 CHANGES
DROP TABLE IF EXISTS public.version_metadata CASCADE;
DROP TABLE IF EXISTS public.project_collaborators CASCADE;
DROP TABLE IF EXISTS public.version_iterations CASCADE;
DROP TABLE IF EXISTS public.song_versions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
ALTER TABLE public.tracks DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.tracks DROP COLUMN IF EXISTS version_id;
ALTER TABLE public.tracks DROP COLUMN IF EXISTS iteration_id;
```
3. Run it to remove all V2 tables

## 📊 What Was Created

### New Tables:
1. **projects** - Your songwriter projects (like albums)
2. **song_versions** - Different versions of songs (v1, v2, acoustic, etc.)
3. **version_iterations** - Individual takes/recordings
4. **project_collaborators** - People you're working with
5. **version_metadata** - Lyrics, chords, notes

### Added to Existing:
- **tracks** table got 3 optional columns to link with projects
- All new columns are nullable (won't affect existing tracks)

## 🎯 Next Step

Once the database is ready, we'll:
1. Create the ProjectContext to manage this data
2. Build the UI components to display projects
3. Test on beta.coretet.app

---

**Remember**: This is all happening in your Supabase cloud database. Both your V1 site (coretet.app) and V2 beta site (beta.coretet.app) share the same database, but V1 doesn't know about these new tables.