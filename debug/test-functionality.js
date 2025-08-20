// test-functionality.js
// Run this in the browser console to test app functionality

const runTests = async () => {
  console.log('🧪 Starting CoreTet Functionality Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Check if user is authenticated
  console.log('📋 Test 1: Authentication');
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (user) {
      console.log('✅ User is authenticated:', user.email);
      results.passed++;
    } else {
      console.log('❌ No authenticated user');
      results.failed++;
    }
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    results.failed++;
  }

  // Test 2: Check localStorage for app data
  console.log('\n📋 Test 2: Local Storage');
  const audioVolume = localStorage.getItem('audioVolume');
  const selectedView = localStorage.getItem('selectedView');
  if (audioVolume !== null || selectedView !== null) {
    console.log('✅ Local storage contains app data');
    console.log(`  - Volume: ${audioVolume}`);
    console.log(`  - View: ${selectedView}`);
    results.passed++;
  } else {
    console.log('⚠️  No app data in local storage');
    results.warnings++;
  }

  // Test 3: Check if audio context is available
  console.log('\n📋 Test 3: Audio Context');
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    console.log('✅ Audio context available');
    console.log(`  - State: ${ctx.state}`);
    console.log(`  - Sample Rate: ${ctx.sampleRate}`);
    ctx.close();
    results.passed++;
  } catch (error) {
    console.error('❌ Audio context test failed:', error);
    results.failed++;
  }

  // Test 4: Check service worker
  console.log('\n📋 Test 4: Service Worker');
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('✅ Service worker registered');
      console.log(`  - Scope: ${registration.scope}`);
      console.log(`  - State: ${registration.active ? 'Active' : 'Inactive'}`);
      results.passed++;
    } else {
      console.log('⚠️  No service worker registration found');
      results.warnings++;
    }
  } else {
    console.log('❌ Service workers not supported');
    results.failed++;
  }

  // Test 5: Check media session API
  console.log('\n📋 Test 5: Media Session API');
  if ('mediaSession' in navigator) {
    console.log('✅ Media Session API available');
    results.passed++;
  } else {
    console.log('⚠️  Media Session API not available');
    results.warnings++;
  }

  // Test 6: Check wake lock API
  console.log('\n📋 Test 6: Wake Lock API');
  if ('wakeLock' in navigator) {
    console.log('✅ Wake Lock API available');
    results.passed++;
  } else {
    console.log('⚠️  Wake Lock API not available');
    results.warnings++;
  }

  // Test 7: Test Supabase connection
  console.log('\n📋 Test 7: Supabase Connection');
  try {
    const { data, error } = await window.supabase
      .from('tracks')
      .select('count')
      .limit(1);
    
    if (!error) {
      console.log('✅ Supabase connection successful');
      results.passed++;
    } else {
      console.log('❌ Supabase connection failed:', error.message);
      results.failed++;
    }
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    results.failed++;
  }

  // Test 8: Check mobile features
  console.log('\n📋 Test 8: Mobile Features');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isTouchDevice = 'ontouchstart' in window;
  
  console.log(`  - Mobile Device: ${isMobile ? '✅ Yes' : '❌ No'}`);
  console.log(`  - PWA Mode: ${isStandalone ? '✅ Yes' : '❌ No'}`);
  console.log(`  - Touch Support: ${isTouchDevice ? '✅ Yes' : '❌ No'}`);
  
  if (isMobile || isTouchDevice) {
    results.passed++;
  } else {
    results.warnings++;
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`\nTotal Score: ${results.passed}/${results.passed + results.failed + results.warnings}`);
  
  return results;
};

// Function to test audio playback
const testAudioPlayback = async (trackId) => {
  console.log('\n🎵 Testing Audio Playback...');
  
  try {
    // Get secure URL from edge function
    const { data, error } = await window.supabase.functions.invoke('get-track-url', {
      body: { trackId }
    });
    
    if (error) {
      console.error('❌ Failed to get track URL:', error);
      return;
    }
    
    if (data?.url) {
      console.log('✅ Got secure URL from edge function');
      
      // Try to play audio
      const audio = new Audio(data.url);
      audio.volume = 0.1; // Low volume for testing
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback started successfully');
            setTimeout(() => {
              audio.pause();
              console.log('✅ Audio paused after 2 seconds');
            }, 2000);
          })
          .catch(error => {
            console.error('❌ Audio playback failed:', error.name, error.message);
            if (error.name === 'NotAllowedError') {
              console.log('💡 Tip: User interaction required. Click somewhere on the page first.');
            }
          });
      }
    }
  } catch (error) {
    console.error('❌ Audio test failed:', error);
  }
};

// Function to test rating system
const testRatingSystem = async (trackId) => {
  console.log('\n⭐ Testing Rating System...');
  
  try {
    // Test personal rating
    console.log('Testing personal rating...');
    const { data: personalRating, error: personalError } = await window.supabase
      .from('personal_track_ratings')
      .upsert({
        track_id: trackId,
        rating: 'liked',
        user_id: (await window.supabase.auth.getUser()).data.user.id
      })
      .select()
      .single();
    
    if (!personalError) {
      console.log('✅ Personal rating saved:', personalRating);
    } else {
      console.error('❌ Personal rating failed:', personalError);
    }
    
    // Test reading ratings
    const { data: ratings, error: readError } = await window.supabase
      .from('personal_track_ratings')
      .select('*')
      .eq('track_id', trackId);
    
    if (!readError) {
      console.log('✅ Ratings retrieved:', ratings);
    } else {
      console.error('❌ Reading ratings failed:', readError);
    }
    
  } catch (error) {
    console.error('❌ Rating test failed:', error);
  }
};

// Export functions to window for easy access
window.CoreTetTests = {
  runTests,
  testAudioPlayback,
  testRatingSystem
};

console.log('🧪 CoreTet Test Suite Loaded!');
console.log('Run tests with: CoreTetTests.runTests()');
console.log('Test audio with: CoreTetTests.testAudioPlayback("track-id")');
console.log('Test ratings with: CoreTetTests.testRatingSystem("track-id")');