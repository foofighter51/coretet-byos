# Correct Storage Policies for audio-files Bucket

## What the Policies Should Be:

### 1. VIEW Policy (SELECT)
**Name:** Users can view their own files
**Check:** 
```sql
bucket_id = 'audio-files' AND 
(storage.foldername(name))[1] = auth.uid()::text
```
This ensures users can ONLY view files in their own user ID folder.

### 2. UPLOAD Policy (INSERT)
**Name:** Users can upload to their own folder
**Check:**
```sql
bucket_id = 'audio-files' AND 
(storage.foldername(name))[1] = auth.uid()::text
```
This ensures users can ONLY upload to their own user ID folder.

### 3. DELETE Policy (DELETE)
**Name:** Users can delete their own files
**Check:**
```sql
bucket_id = 'audio-files' AND 
(storage.foldername(name))[1] = auth.uid()::text
```
This ensures users can ONLY delete files in their own user ID folder.

## The Problem
If your current policies say something like:
- "Authenticated users can view audio files" WITHOUT the folder check
- Or they check `auth.role() = 'authenticated'` only

Then ANY logged-in user can access ANY file!

## Additional Policy Needed for Sharing
Add this fourth policy for shared playlists:

**Name:** Users can view files in shared playlists
**Operation:** SELECT
**Check:**
```sql
bucket_id = 'audio-files' AND
EXISTS (
  SELECT 1 FROM tracks t
  JOIN playlist_tracks pt ON pt.track_id = t.id
  JOIN playlists p ON p.id = pt.playlist_id
  LEFT JOIN playlist_shares ps ON ps.playlist_id = p.id
  WHERE t.storage_path = name
  AND (
    p.user_id = auth.uid() OR
    (ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
     AND ps.status = 'active')
  )
)
```

## How to Fix via Dashboard
1. Go to each policy
2. Click Edit
3. Replace the "Check expression" with the correct one above
4. Save

The key is that ALL policies must check the folder structure to ensure isolation!