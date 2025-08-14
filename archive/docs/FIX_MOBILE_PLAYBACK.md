# Fix Mobile Playback Issues

## Common Mobile Audio Issues

1. **iOS Safari Requirements**
   - Requires user interaction before playing
   - No autoplay without user gesture
   - Background playback stops when screen locks

2. **Android Chrome Issues**
   - May pause when switching tabs
   - Requires proper audio context setup

## Quick Fixes to Test

### 1. Update MobileNowPlaying to handle mobile audio better:

```typescript
// Add to MobileNowPlaying.tsx
const initializeAudioForMobile = () => {
  // Create a silent audio element and play it on first user interaction
  const silentAudio = new Audio();
  silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAAAAAAA=';
  silentAudio.play().catch(() => {
    // User hasn't interacted yet
    setNeedsUserInteraction(true);
  });
};

// Add a play button overlay for iOS
{needsUserInteraction && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <button 
      onClick={() => {
        initializeAudioForMobile();
        setNeedsUserInteraction(false);
        play(currentTrack.id, currentTrack.url);
      }}
      className="bg-white p-8 rounded-full"
    >
      <Play className="w-12 h-12" />
      <p className="mt-2">Tap to start playback</p>
    </button>
  </div>
)}
```

### 2. Add wake lock to prevent screen sleep during playback:

```typescript
// Add to AudioContext.tsx
useEffect(() => {
  let wakeLock: any = null;

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && isPlaying) {
        wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake lock failed:', err);
    }
  };

  if (isPlaying) {
    requestWakeLock();
  }

  return () => {
    if (wakeLock) {
      wakeLock.release();
    }
  };
}, [isPlaying]);
```

### 3. Add media session API for better mobile controls:

```typescript
// Add to AudioContext when track plays
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.name,
    artist: 'CoreTet',
    album: playlist?.name || 'My Library'
  });

  navigator.mediaSession.setActionHandler('play', () => play());
  navigator.mediaSession.setActionHandler('pause', () => pause());
  navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
  navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
}
```

## Testing Mobile Playback

1. **Test on real devices** - Simulators don't have same audio restrictions
2. **Test background playback** - Lock screen while playing
3. **Test interruptions** - Phone calls, other apps
4. **Test network changes** - WiFi to cellular

## Progressive Web App Enhancements

Add to your PWA manifest for better mobile experience:

```json
{
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "categories": ["music", "entertainment"]
}
```