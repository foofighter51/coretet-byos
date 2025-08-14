// Supabase Client Configuration for Mobile App
// Copy this to your mobile app and adjust for React Native if needed

import { createClient } from '@supabase/supabase-js';

// Environment variables - Replace these with your actual values
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// Mobile-optimized Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // For React Native, you might need to use AsyncStorage instead:
    // storage: AsyncStorage,
    storage: localStorage,
  },
  global: {
    // Add timeout to fetch requests (30 seconds)
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
});

// Helper functions for common operations

export const signInWithMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // For mobile apps, you might want to use a deep link here
      emailRedirectTo: window.location.origin,
    },
  });
  return { error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (event: string, session: unknown) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Storage helpers for audio files
export const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from('tracks').getPublicUrl(path);
  return data.publicUrl;
};

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('tracks')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  return { data, error };
};

export const deleteFile = async (path: string) => {
  const { error } = await supabase.storage
    .from('tracks')
    .remove([path]);
  return { error };
};