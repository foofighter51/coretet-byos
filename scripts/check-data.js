#!/usr/bin/env node

/**
 * Data inspection script for CoreTet BYOS
 * Checks what data exists in V1 and V2 tables
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectData() {
  console.log('📊 CoreTet Data Inspector');
  console.log('=========================');
  
  try {
    // Check V1 data
    console.log('\n🎵 V1 Data (Traditional CoreTet):');
    
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id, title, artist, storage_provider, provider_file_id, created_at')
      .limit(10);
    
    if (tracksError) {
      console.log(`❌ Tracks: Error - ${tracksError.message}`);
    } else {
      console.log(`✅ Tracks: ${tracks.length} records`);
      tracks.forEach(track => {
        const provider = track.storage_provider || 'supabase';
        const type = track.provider_file_id ? 'BYOS' : 'Local';
        console.log(`   - "${track.title}" by ${track.artist || 'Unknown'} (${type}/${provider})`);
      });
    }

    const { data: playlists } = await supabase
      .from('playlists')
      .select('id, name')
      .limit(5);
    console.log(`✅ Playlists: ${playlists?.length || 0} records`);

    // Check V2 data
    console.log('\n🎼 V2 Data (Works-based):');
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, artist, status, created_at')
      .limit(10);
    
    if (projectsError) {
      console.log(`❌ Projects: Error - ${projectsError.message}`);
    } else {
      console.log(`✅ Projects: ${projects.length} records`);
      projects.forEach(project => {
        console.log(`   - "${project.name}" by ${project.artist || 'Unknown'} (${project.status})`);
      });
    }

    const { data: versions } = await supabase
      .from('song_versions')
      .select('id, name, project_id, is_primary')
      .limit(10);
    console.log(`✅ Song Versions: ${versions?.length || 0} records`);

    const { data: iterations } = await supabase
      .from('version_iterations')
      .select('id, iteration_name, version_id, file_url')
      .limit(10);
    console.log(`✅ Version Iterations: ${iterations?.length || 0} records`);

    // Summary
    console.log('\n📈 Summary:');
    console.log(`🎵 V1 Tracks: ${tracks?.length || 0}`);
    console.log(`📁 V1 Playlists: ${playlists?.length || 0}`);
    console.log(`🎼 V2 Works: ${projects?.length || 0}`);
    console.log(`📝 V2 Versions: ${versions?.length || 0}`);
    console.log(`🎤 V2 Iterations: ${iterations?.length || 0}`);

    if ((tracks?.length || 0) > 0 && (projects?.length || 0) === 0) {
      console.log('\n💡 Suggestion: You have V1 tracks but no V2 works.');
      console.log('   Try creating a work in the V2 interface to test the workflow.');
    }

  } catch (error) {
    console.error('❌ Data inspection failed:', error.message);
  }
}

inspectData();