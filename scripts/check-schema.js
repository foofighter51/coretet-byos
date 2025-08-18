#!/usr/bin/env node

/**
 * Schema inspection script for CoreTet BYOS
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('🔍 Schema Inspector');
  console.log('==================');
  
  try {
    // Get a sample track to see actual columns
    console.log('\n📋 Actual tracks table columns:');
    const { data: sampleTrack, error } = await supabase
      .from('tracks')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.log('❌ Error accessing tracks:', error.message);
    } else if (sampleTrack) {
      console.log('✅ Available columns:');
      Object.keys(sampleTrack).forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('📭 No data in tracks table, trying to get structure...');
      
      // Try to get table structure by attempting selects
      const commonColumns = ['id', 'user_id', 'file_name', 'title', 'artist', 'file_url', 'created_at', 'storage_provider', 'provider_file_id', 'provider_url', 's3_key'];
      
      for (const col of commonColumns) {
        try {
          await supabase.from('tracks').select(col).limit(1);
          console.log(`   ✅ ${col}`);
        } catch (err) {
          console.log(`   ❌ ${col} - doesn't exist`);
        }
      }
    }

    // Check if V2 tables actually exist
    console.log('\n🎼 V2 Tables Check:');
    const v2Tables = ['projects', 'song_versions', 'version_iterations'];
    
    for (const table of v2Tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema();