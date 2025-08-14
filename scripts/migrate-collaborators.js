// Script to migrate collaborators to Supabase Auth users
// Run with: node scripts/migrate-collaborators.js

import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service role key for admin operations

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateCollaborators() {
  try {
    console.log('Starting collaborator migration...');

    // 1. Fetch all existing collaborators
    const { data: collaborators, error: fetchError } = await supabase
      .from('collaborators')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch collaborators: ${fetchError.message}`);
    }

    console.log(`Found ${collaborators.length} collaborators to migrate`);

    const migrationResults = [];

    // 2. Create auth users for each collaborator
    for (const collaborator of collaborators) {
      console.log(`Migrating collaborator: ${collaborator.email}`);

      try {
        // Create auth user with temporary password
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: collaborator.email,
          password: crypto.randomUUID(), // Temporary password - user will need to reset
          email_confirm: true,
          user_metadata: {
            role: 'collaborator',
            name: collaborator.name,
            migrated_from_collaborator_id: collaborator.id
          }
        });

        if (createError) {
          console.error(`Failed to create auth user for ${collaborator.email}: ${createError.message}`);
          migrationResults.push({
            collaborator_id: collaborator.id,
            email: collaborator.email,
            success: false,
            error: createError.message
          });
          continue;
        }

        // 3. Map old collaborator ID to new auth user ID
        const { error: mapError } = await supabase
          .from('collaborator_migration_map')
          .insert({
            old_collaborator_id: collaborator.id,
            new_auth_user_id: authUser.user.id
          });

        if (mapError) {
          console.error(`Failed to create migration mapping: ${mapError.message}`);
        }

        // 4. Update playlist_shares with new user ID
        const { error: updateError } = await supabase
          .from('playlist_shares')
          .update({ shared_with_user_id: authUser.user.id })
          .eq('collaborator_id', collaborator.id);

        if (updateError) {
          console.error(`Failed to update playlist_shares: ${updateError.message}`);
        }

        migrationResults.push({
          collaborator_id: collaborator.id,
          email: collaborator.email,
          new_user_id: authUser.user.id,
          success: true
        });

        console.log(`✓ Successfully migrated ${collaborator.email}`);

      } catch (err) {
        console.error(`Error migrating ${collaborator.email}:`, err);
        migrationResults.push({
          collaborator_id: collaborator.id,
          email: collaborator.email,
          success: false,
          error: err.message
        });
      }
    }

    // 5. Generate report
    console.log('\n=== Migration Summary ===');
    console.log(`Total collaborators: ${collaborators.length}`);
    console.log(`Successfully migrated: ${migrationResults.filter(r => r.success).length}`);
    console.log(`Failed: ${migrationResults.filter(r => !r.success).length}`);

    // 6. Save migration report
    await supabase
      .from('migration_logs')
      .insert({
        migration_type: 'collaborators_to_auth',
        results: migrationResults,
        completed_at: new Date().toISOString()
      });

    console.log('\nMigration complete!');
    console.log('\nNext steps:');
    console.log('1. Send password reset emails to all migrated collaborators');
    console.log('2. Update frontend to use Supabase Auth for all users');
    console.log('3. Test the new authentication flow');
    console.log('4. Once verified, run cleanup migration to remove old tables');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCollaborators();