import { supabase } from '../lib/supabase';

export const debugDatabaseConnection = async () => {
  try {
    // Test basic connection
    await supabase
      .from('profiles')
      .select('count')
      .limit(1);
  } catch (_error) {
    // Database connection error silently handled
  }
};

export const testUserCreation = async () => {
  try {
    // Test if we can read from user_roles table
    await supabase
      .from('user_roles')
      .select('count')
      .limit(1);
  } catch (_error) {
    // User creation test error silently handled
  }
};