/**
 * Script to apply the playlist migration
 * Run this to create the playlist tables in your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250723_create_playlists_table_safe.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('Applying playlist migration...');
    
    // Note: This requires using Supabase's SQL editor or admin access
    // The anon key doesn't have permission to create tables
    console.log('\n⚠️  Important: The migration SQL cannot be run via the client library.');
    console.log('Please run the following SQL in your Supabase dashboard:\n');
    console.log('1. Go to your Supabase project');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the migration from:');
    console.log(`   ${migrationPath}`);
    console.log('\nOr copy the SQL below:\n');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();