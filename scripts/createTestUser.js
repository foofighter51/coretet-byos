#!/usr/bin/env node

/**
 * Script to create a test user for Apple App Review
 * Run with: node scripts/createTestUser.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - try .env first, then .env.local
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.error('You can find it in your Supabase project settings under API');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USER = {
  email: 'apple.review@coretet.test',
  password: 'AppleTest2025!',
  fullName: 'Apple Review Tester'
};

async function createTestUser() {
  console.log('Creating test user for Apple App Review...\n');
  console.log('Email:', TEST_USER.email);
  console.log('Password:', TEST_USER.password);
  console.log('-----------------------------------\n');

  try {
    // Step 1: Create the user in Auth
    console.log('Step 1: Creating user in Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: TEST_USER.fullName,
        is_test_user: true
      }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('User already exists in Auth. Fetching user...');
        
        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === TEST_USER.email);
        if (!existingUser) throw new Error('Could not find existing user');
        
        console.log('Found existing user:', existingUser.id);
        
        // Update password for existing user
        console.log('Updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: TEST_USER.password }
        );
        
        if (updateError) {
          console.error('Warning: Could not update password:', updateError.message);
        } else {
          console.log('Password updated successfully');
        }
        
        authData.user = existingUser;
      } else {
        throw authError;
      }
    } else {
      console.log('✓ User created in Auth:', authData.user.id);
    }

    const userId = authData.user.id;

    // Step 2: Create/Update profile
    console.log('\nStep 2: Setting up user profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: TEST_USER.email,
        storage_used: 0,
        storage_limit: 5368709120, // 5GB
        is_active: true,
        invited_by: null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Warning: Profile error:', profileError.message);
    } else {
      console.log('✓ Profile created/updated');
    }

    // Step 3: Grant user role
    console.log('\nStep 3: Granting user role...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'user'
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      console.error('Warning: Role error:', roleError.message);
    } else {
      console.log('✓ User role granted');
    }

    // Step 4: Create sample data
    console.log('\nStep 4: Creating sample data...');
    
    // Create a sample playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name: 'Apple Review Test Playlist',
        description: 'Sample playlist for app review testing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (playlistError) {
      console.error('Warning: Could not create playlist:', playlistError.message);
    } else {
      console.log('✓ Sample playlist created:', playlist.name);
    }

    // Create sample tracks
    const sampleTracks = [
      {
        user_id: userId,
        name: 'Sample Track 1 - Ambient Loop',
        artist: 'Test Artist',
        collection: 'Test Collection',
        category: 'loops',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: 180,
        tempo: '120',
        key: 'C',
        tags: ['test', 'ambient', 'loop'],
        listened: false,
        liked: false,
        loved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        uploadedAt: new Date().toISOString()
      },
      {
        user_id: userId,
        name: 'Sample Track 2 - Beat',
        artist: 'Demo Producer',
        collection: 'Demo Beats',
        category: 'songs',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        duration: 240,
        tempo: '140',
        key: 'G',
        tags: ['test', 'beat', 'demo'],
        listened: true,
        liked: true,
        loved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        uploadedAt: new Date().toISOString()
      },
      {
        user_id: userId,
        name: 'Sample Track 3 - One Shot',
        artist: 'Sound Designer',
        collection: 'SFX Pack',
        category: 'oneshots',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        duration: 30,
        tempo: null,
        key: null,
        tags: ['test', 'oneshot', 'sfx'],
        listened: true,
        liked: false,
        loved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        uploadedAt: new Date().toISOString()
      }
    ];

    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .insert(sampleTracks)
      .select();

    if (tracksError) {
      console.error('Warning: Could not create sample tracks:', tracksError.message);
    } else {
      console.log(`✓ ${tracks.length} sample tracks created`);
    }

    // Add tracks to playlist if both were created successfully
    if (playlist && tracks && tracks.length > 0) {
      const playlistTracks = tracks.map((track, index) => ({
        playlist_id: playlist.id,
        track_id: track.id,
        position: index,
        added_at: new Date().toISOString()
      }));

      const { error: playlistTracksError } = await supabase
        .from('playlist_tracks')
        .insert(playlistTracks);

      if (playlistTracksError) {
        console.error('Warning: Could not add tracks to playlist:', playlistTracksError.message);
      } else {
        console.log('✓ Tracks added to playlist');
      }
    }

    console.log('\n========================================');
    console.log('✅ Test user setup completed!');
    console.log('========================================');
    console.log('\nTest User Credentials:');
    console.log('Email:', TEST_USER.email);
    console.log('Password:', TEST_USER.password);
    console.log('\nUser ID:', userId);
    console.log('\nYou can now use these credentials for Apple App Review.');
    console.log('\nNote: The sample tracks use public audio files.');
    console.log('You may want to replace them with your own test audio files.');

  } catch (error) {
    console.error('\n❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestUser();