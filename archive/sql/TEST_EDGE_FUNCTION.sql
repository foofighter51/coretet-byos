-- TEST EDGE FUNCTION
-- This tests the get-track-url edge function

-- First, get a track ID to test with
WITH test_track AS (
  SELECT 
    id as track_id,
    name as track_name,
    storage_path
  FROM tracks
  WHERE user_id = auth.uid()
  LIMIT 1
)
SELECT 
  '🧪 Edge Function Test Setup' as test_name,
  'Track ID: ' || track_id as track_info,
  'Track Name: ' || track_name as track_name,
  'Storage Path: ' || storage_path as storage_path,
  '
  To test the edge function, run this in your browser console:
  
  const trackId = "' || track_id || '";
  const { data, error } = await supabase.functions.invoke("get-track-url", {
    body: { trackId }
  });
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! URL:", data.url);
  }
  ' as test_instructions
FROM test_track;

-- Verify edge function permissions
SELECT 
  '🔒 Edge Function Permissions' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ User has tracks to test with'
    ELSE '❌ No tracks found for testing'
  END as result,
  COUNT(*) as available_tracks
FROM tracks
WHERE user_id = auth.uid();