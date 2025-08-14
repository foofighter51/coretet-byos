# Test Edge Function Directly

## Test the edge function in browser console:

```javascript
// Run this in your browser console while logged into your app
const testEdgeFunction = async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  
  if (!session) {
    console.error('Not logged in');
    return;
  }
  
  // Test with a known track ID
  const trackId = '2ab4bd7f-112d-4160-8caf-868182926634';
  
  const response = await fetch('https://chynnmeidbcqsnswlxmt.supabase.co/functions/v1/get-track-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ trackId })
  });
  
  const result = await response.json();
  console.log('Edge function response:', result);
  
  if (result.url) {
    // Try to play the URL
    const audio = new Audio(result.url);
    audio.play().catch(e => console.error('Play error:', e));
  }
};

testEdgeFunction();
```

## What we're checking:
1. Can the edge function be called?
2. Does it return a signed URL?
3. Does that URL actually work?

## If it fails, check:
1. Is the edge function deployed?
2. Are there any errors in the Supabase function logs?
3. Is the service role key set correctly?