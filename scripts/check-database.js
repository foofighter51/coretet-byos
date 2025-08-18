#!/usr/bin/env node

/**
 * Database inspection script for CoreTet BYOS
 * Checks current Supabase project and existing tables
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please check .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.split('//')[1].split('.')[0];

console.log('🔍 CoreTet Database Inspector');
console.log('===========================');
console.log(`📡 Supabase URL: ${supabaseUrl}`);
console.log(`🆔 Project Reference: ${projectRef}`);
console.log();

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  try {
    // Check if we can connect
    console.log('🔌 Testing connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')  // This should exist in any CoreTet project
      .select('count', { count: 'exact', head: true });
    
    if (healthError && healthError.code !== 'PGRST116') { // PGRST116 is "table not found", which is expected if profiles doesn't exist
      console.error('❌ Connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Connection successful');
    console.log();

    // List existing tables by attempting to query them
    const tablesToCheck = [
      'profiles',
      'tracks', 
      'playlists',
      'playlist_tracks',
      'projects',        // V2 table
      'song_versions',   // V2 table
      'version_iterations', // V2 table
      'version_metadata',   // V2 table
      'project_collaborators' // V2 table
    ];

    console.log('📋 Checking existing tables:');
    console.log('============================');

    const existingTables = [];
    const missingTables = [];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          missingTables.push(table);
          console.log(`❌ ${table} - NOT FOUND`);
        } else {
          existingTables.push(table);
          console.log(`✅ ${table} - EXISTS`);
        }
      } catch (err) {
        missingTables.push(table);
        console.log(`❌ ${table} - ERROR: ${err.message}`);
      }
    }

    console.log();
    console.log('📊 Summary:');
    console.log(`✅ Existing tables: ${existingTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log();
      console.log('🚨 Missing V2 tables:');
      missingTables.filter(t => ['projects', 'song_versions', 'version_iterations', 'version_metadata', 'project_collaborators'].includes(t))
        .forEach(table => console.log(`   - ${table}`));
      
      console.log();
      console.log('💡 To create V2 tables, run the database migration:');
      console.log('   Execute database/v2_complete_schema.sql in Supabase Dashboard');
    }

    // Check if we have BYOS-related tables/columns
    console.log();
    console.log('🗂️ Checking BYOS integration:');
    if (existingTables.includes('tracks')) {
      try {
        // Check if tracks table has BYOS columns
        const { data: sampleTrack } = await supabase
          .from('tracks')
          .select('storage_provider, provider_file_id, provider_url, s3_key')
          .limit(1)
          .single();
        
        if (sampleTrack !== null || sampleTrack) {
          console.log('✅ BYOS columns exist in tracks table');
        }
      } catch (err) {
        if (err.message.includes('column') && err.message.includes('does not exist')) {
          console.log('❌ BYOS columns missing from tracks table');
        }
      }
    }

    console.log();
    console.log('🎯 Project Status:');
    console.log(`📍 This appears to be the ${existingTables.includes('tracks') ? 'CoreTet BYOS' : 'new/empty'} project`);
    console.log(`🔧 V2 Ready: ${existingTables.includes('projects') ? 'YES' : 'NO'}`);
    console.log(`☁️  BYOS Ready: ${existingTables.includes('tracks') ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
  }
}

inspectDatabase().then(() => {
  console.log();
  console.log('🏁 Database inspection complete');
});