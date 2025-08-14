import { supabase } from '../lib/supabase';

export const createAdminUser = async (email: string, password: string) => {
  try {
    // Create user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // Set user role to admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: data.user.id,
        role: 'admin'
      });

    if (roleError) {
      return { success: false, error: 'Failed to set admin role' };
    }

    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to create admin user' };
  }
};

export const createFirstInvite = async () => {
  try {
    // Generate unique invite code
    const generateInviteCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const { error } = await supabase
      .from('invites')
      .insert({
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      return { success: false, error: 'Failed to create invite' };
    }

    return { success: true, code };
  } catch (_error) {
    return { success: false, error: 'Failed to create invite' };
  }
};