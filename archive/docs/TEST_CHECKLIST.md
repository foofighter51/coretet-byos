# CoreTet Functionality Test Checklist

## 🔐 1. Authentication Tests

- [ ] **Login Flow**
  - [ ] Can log in with email/password
  - [ ] Can log out successfully
  - [ ] Session persists on page refresh
  - [ ] Redirected to login when unauthorized

- [ ] **User Profile**
  - [ ] Profile displays correct email
  - [ ] Profile data loads correctly

## 🎵 2. Track Management Tests

- [ ] **Upload**
  - [ ] Can select and upload audio file
  - [ ] Progress bar shows during upload
  - [ ] Track appears in library after upload
  - [ ] Metadata (name, artist, duration) saved correctly

- [ ] **Playback**
  - [ ] Tracks play when clicked
  - [ ] Play/pause controls work
  - [ ] Progress bar updates during playback
  - [ ] Volume control works
  - [ ] Next/previous track navigation works

- [ ] **Library Management**
  - [ ] Can view all tracks
  - [ ] Can filter by category
  - [ ] Can edit track metadata
  - [ ] Can delete tracks

## 📋 3. Playlist Tests

- [ ] **Creation**
  - [ ] Can create new playlist
  - [ ] Can name playlist
  - [ ] Playlist appears in sidebar

- [ ] **Management**
  - [ ] Can add tracks to playlist
  - [ ] Can reorder tracks in playlist
  - [ ] Can remove tracks from playlist
  - [ ] Can rename playlist
  - [ ] Can delete playlist

- [ ] **Sharing**
  - [ ] Can share playlist via email
  - [ ] Recipient receives invite
  - [ ] Shared playlists appear for recipient
  - [ ] Access controls work properly

## ⭐ 4. Rating System Tests

- [ ] **Personal Ratings**
  - [ ] Can rate track as listened/liked/loved
  - [ ] Rating persists on refresh
  - [ ] Can change rating
  - [ ] Can remove rating

- [ ] **Playlist Ratings**
  - [ ] Can rate tracks in shared playlists
  - [ ] Other users can see rating counts
  - [ ] Rating summaries update correctly

## 📱 5. Mobile-Specific Tests

- [ ] **Responsive Design**
  - [ ] UI adapts to mobile screen
  - [ ] Touch interactions work smoothly
  - [ ] Navigation menu accessible

- [ ] **Playback**
  - [ ] Audio plays on mobile browsers
  - [ ] User interaction prompt appears if needed
  - [ ] Background playback continues
  - [ ] Lock screen controls work (if supported)

- [ ] **PWA Features**
  - [ ] Can install as app
  - [ ] Works offline (cached content)
  - [ ] Push notifications (if implemented)

## 🔧 6. Edge Cases & Error Handling

- [ ] **Network Issues**
  - [ ] Graceful handling of connection loss
  - [ ] Retry mechanisms work
  - [ ] Offline message appears

- [ ] **Invalid Data**
  - [ ] Non-audio files rejected on upload
  - [ ] Large files handled appropriately
  - [ ] Invalid metadata rejected

- [ ] **Concurrent Use**
  - [ ] Multiple tabs/devices sync properly
  - [ ] Real-time updates work

## 🚀 7. Performance Tests

- [ ] **Load Times**
  - [ ] Initial page load < 3 seconds
  - [ ] Track list loads quickly
  - [ ] Search/filter responsive

- [ ] **Memory Usage**
  - [ ] No memory leaks during playback
  - [ ] Large playlists handled efficiently

## 🧪 8. SQL Test Execution

Run these SQL files in Supabase SQL editor:

1. **Run TEST_SUITE.sql**
   - [ ] All authentication tests pass
   - [ ] All storage tests pass
   - [ ] All playlist tests pass
   - [ ] All rating tests pass
   - [ ] All integrity tests pass

2. **Run QUICK_DIAGNOSTIC.sql**
   - [ ] User info displays correctly
   - [ ] Track counts are accurate
   - [ ] Playlist counts are accurate
   - [ ] Recent activity shows

3. **Run TEST_EDGE_FUNCTION.sql**
   - [ ] Get test track ID
   - [ ] Execute edge function test in browser console
   - [ ] Verify signed URL is returned

## 🌐 9. Browser Console Tests

1. **Load test-functionality.js in console**
   ```javascript
   const script = document.createElement('script');
   script.src = '/test-functionality.js';
   document.head.appendChild(script);
   ```

2. **Run automated tests**
   ```javascript
   CoreTetTests.runTests()
   ```
   - [ ] All tests pass or show warnings

3. **Test audio playback** (replace with actual track ID)
   ```javascript
   CoreTetTests.testAudioPlayback('your-track-id')
   ```
   - [ ] Audio plays successfully

4. **Test rating system** (replace with actual track ID)
   ```javascript
   CoreTetTests.testRatingSystem('your-track-id')
   ```
   - [ ] Rating saves successfully

## 📝 Notes

Record any issues found:

1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

## ✅ Test Summary

- Total Tests: ____
- Passed: ____
- Failed: ____
- Date: ____
- Tester: ____