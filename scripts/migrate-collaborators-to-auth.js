/**
 * Script to migrate collaborators to Supabase Auth users
 * 
 * This script helps migrate existing collaborators from the custom collaborators table
 * to proper Supabase Auth users. It should be run once during the migration process.
 * 
 * Prerequisites:
 * - Supabase project with admin access
 * - Node.js environment
 * - @supabase/supabase-js installed
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - replace with your actual values
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateCollaborators() {
  try {
    console.log('Starting collaborator migration...\n');

    // Step 1: Fetch all existing collaborators
    const { data: collaborators, error: fetchError } = await supabase
      .from('collaborators')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch collaborators: ${fetchError.message}`);
    }

    if (!collaborators || collaborators.length === 0) {
      console.log('No collaborators found to migrate.');
      return;
    }

    console.log(`Found ${collaborators.length} collaborators to migrate.\n`);

    const migrationResults = [];

    // Step 2: Process each collaborator
    for (const collaborator of collaborators) {
      console.log(`Processing ${collaborator.email}...`);

      try {
        // Create auth user with a temporary password
        // In production, you'd want to send password reset emails
        const tempPassword = generateTempPassword();
        
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: collaborator.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            role: 'collaborator',
            original_collaborator_id: collaborator.id,
            migrated_at: new Date().toISOString()
          }
        });

        if (createError) {
          if (createError.message.includes('already exists')) {
            console.log(`  User already exists for ${collaborator.email}, linking...`);
            
            // Try to find existing user
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email === collaborator.email);
            
            if (existingUser) {
              await recordMigration(collaborator.id, existingUser.id);
              migrationResults.push({
                email: collaborator.email,
                status: 'linked_existing',
                authUserId: existingUser.id
              });
            }
          } else {
            throw createError;
          }
        } else if (authUser) {
          // Record the migration mapping
          await recordMigration(collaborator.id, authUser.user.id);
          
          migrationResults.push({
            email: collaborator.email,
            status: 'created',
            authUserId: authUser.user.id,
            tempPassword
          });

          console.log(`  ✓ Created auth user for ${collaborator.email}`);
        }

        // Step 3: Update playlist_shares to use the new auth user ID
        const { error: updateError } = await supabase
          .from('playlist_shares')
          .update({ shared_with_user_id: authUser?.user.id || existingUser.id })
          .eq('collaborator_id', collaborator.id);

        if (updateError) {
          console.error(`  Failed to update playlist_shares: ${updateError.message}`);
        } else {
          console.log(`  ✓ Updated playlist_shares`);
        }

      } catch (error) {
        console.error(`  ✗ Failed to migrate ${collaborator.email}: ${error.message}`);
        migrationResults.push({
          email: collaborator.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Step 4: Generate migration report
    console.log('\n=== Migration Summary ===\n');
    
    const successful = migrationResults.filter(r => r.status !== 'failed');
    const failed = migrationResults.filter(r => r.status === 'failed');
    
    console.log(`Total collaborators: ${collaborators.length}`);
    console.log(`Successfully migrated: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n=== Action Required ===');
      console.log('Send password reset emails to the following users:\n');
      
      successful.forEach(result => {
        if (result.status === 'created') {
          console.log(`- ${result.email} (temporary password: ${result.tempPassword})`);
        }
      });
    }
    
    if (failed.length > 0) {
      console.log('\n=== Failed Migrations ===\n');
      failed.forEach(result => {
        console.log(`- ${result.email}: ${result.error}`);
      });
    }

    // Save results to file
    const fs = await import('fs').then(m => m.promises);
    await fs.writeFile(
      'migration-results.json',
      JSON.stringify(migrationResults, null, 2)
    );
    
    console.log('\nMigration results saved to migration-results.json');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function recordMigration(collaboratorId, authUserId) {
  const { error } = await supabase
    .from('collaborator_migration_map')
    .insert({
      old_collaborator_id: collaboratorId,
      new_auth_user_id: authUserId
    });
    
  if (error && !error.message.includes('duplicate')) {
    console.error(`Failed to record migration mapping: ${error.message}`);
  }
}

function generateTempPassword() {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Run the migration
migrateCollaborators();