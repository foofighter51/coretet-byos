// Magic Link Authentication Implementation for CoreTet Mobile

import { supabase } from '../supabase/client';

// =====================================================
// AUTHENTICATION FLOW
// =====================================================

interface AuthResponse {
  success: boolean;
  error?: string;
  message?: string;
}

// 1. Send Magic Link
export const sendMagicLink = async (email: string): Promise<AuthResponse> => {
  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // For mobile apps, use a deep link that your app can handle
        emailRedirectTo: 'coretet://auth/callback',
        // Alternative for web-based mobile apps:
        // emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Check your email for the login link!' 
    };
  } catch (error) {
    console.error('Magic link error:', error);
    return { success: false, error: 'Failed to send magic link' };
  }
};

// 2. Handle Magic Link Callback
export const handleMagicLinkCallback = async (): Promise<AuthResponse> => {
  try {
    // Extract the token from the URL
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.session) {
      return { success: false, error: 'No valid session found' };
    }

    // Session is automatically handled by Supabase client
    return { success: true, message: 'Successfully logged in!' };
  } catch (error) {
    console.error('Callback error:', error);
    return { success: false, error: 'Failed to process login' };
  }
};

// 3. Check Authentication Status
export const checkAuthStatus = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, user: null, error };
  }
  
  return {
    isAuthenticated: !!session,
    user: session?.user || null,
    session,
  };
};

// 4. Get User Profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Profile fetch error:', error);
    return null;
  }
  
  return data;
};

// 5. Create/Update User Profile
export const createOrUpdateProfile = async (userId: string, email: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    console.error('Profile upsert error:', error);
    return null;
  }
  
  return data;
};

// 6. Sign Out
export const signOut = async (): Promise<AuthResponse> => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, message: 'Successfully signed out' };
};

// 7. Session Management
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error('Session refresh error:', error);
    return null;
  }
  
  return data.session;
};

// 8. Auth State Listener
export const subscribeToAuthChanges = (callback: (event: string, session: unknown) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    callback(event, session);
  });
};

// =====================================================
// MOBILE-SPECIFIC CONSIDERATIONS
// =====================================================

// For React Native, you'll need to:
// 1. Handle deep links in your app configuration
// 2. Use AsyncStorage instead of localStorage
// 3. Configure URL schemes for your app

// Example React Native setup:
/*
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Deep links handled differently in RN
  },
});

// Handle deep link in your app
import { Linking } from 'react-native';

Linking.addEventListener('url', (event) => {
  if (event.url.includes('auth/callback')) {
    handleMagicLinkCallback(event.url);
  }
});
*/

// =====================================================
// USAGE EXAMPLE
// =====================================================

/*
// In your login component:
const handleLogin = async (email: string) => {
  const result = await sendMagicLink(email);
  if (result.success) {
    // Show success message
    alert(result.message);
  } else {
    // Show error
    alert(result.error);
  }
};

// In your app initialization:
const unsubscribe = subscribeToAuthChanges((event, session) => {
  if (event === 'SIGNED_IN') {
    // Navigate to main app
    navigation.navigate('Home');
  } else if (event === 'SIGNED_OUT') {
    // Navigate to login
    navigation.navigate('Login');
  }
});

// Check auth on app start:
const initAuth = async () => {
  const { isAuthenticated, user } = await checkAuthStatus();
  if (isAuthenticated && user) {
    const profile = await getUserProfile(user.id);
    // Set user context
  }
};
*/