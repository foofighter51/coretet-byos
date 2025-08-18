#!/usr/bin/env node

/**
 * V2 Database Setup Script for CoreTet BYOS
 * Creates V2 tables directly through Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log('🚀 CoreTet V2 Database Setup');
console.log('============================');
console.log(`📡 Target: ${process.env.VITE_SUPABASE_URL}`);
console.log();

async function setupV2Database() {
  try {
    console.log('⚠️  This script requires DIRECT SQL execution on the database.');
    console.log('📋 Please execute the following SQL in your Supabase Dashboard:');
    console.log('   Go to: Dashboard > SQL Editor > New Query');
    console.log();
    console.log('📂 Copy and paste the SQL from: database/v2_complete_schema.sql');
    console.log();
    console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/vqkpdfkevjtdloldmqcb');
    console.log();
    
    // Test connection first
    console.log('🔌 Testing connection to verify project access...');
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, but connection works
      console.log('✅ Connection successful (profiles table may not exist yet)');
    } else if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    } else {
      console.log('✅ Connection successful');
    }

    console.log();
    console.log('📝 After running the SQL, you can verify with:');
    console.log('   npm run check-data');
    console.log();
    console.log('💡 Alternative: Use the V2 Database Setup in the app at:');
    console.log('   https://beta.coretet.app (look for admin/setup options)');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log();
    console.log('🆘 Fallback options:');
    console.log('1. Run the SQL manually in Supabase Dashboard');
    console.log('2. Contact admin to create the V2 tables');
    console.log('3. Use the web interface setup (if available)');
  }
}

setupV2Database();