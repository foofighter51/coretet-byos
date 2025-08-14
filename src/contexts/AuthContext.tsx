import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthError {
  message: string;
  [key: string]: unknown;
}

interface Profile {
  id: string;
  email: string;
  storage_used: number;
  storage_limit: number;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRole: UserRole | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, inviteCode: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 3;

    const initAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading (60 seconds for slower connections)
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.error('Auth initialization timed out after 60 seconds');
            // Retry if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              retryCount++;
              clearTimeout(timeoutId);
              initAuth(); // Retry
            } else {
              console.error('Auth initialization failed after maximum retries');
              // Set user as null but stop loading to allow app to function
              setUser(null);
              setSession(null);
              setLoading(false);
            }
          }
        }, 60000); // 60 second timeout for slower connections

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          // Retry on error if we haven't exceeded max retries
          if (retryCount < maxRetries && error.message?.includes('fetch')) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            clearTimeout(timeoutId);
            return initAuth(); // Retry
          }
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Retry on network errors
        if (mounted && retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          clearTimeout(timeoutId);
          return initAuth(); // Retry
        }
        if (mounted) {
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string, retryAttempt = 0) => {
    const maxRetries = 3;
    try {
      // Load profile with timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 15000)
      );
      
      // Race between the profile load and timeout
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]).catch(error => ({ data: null, error }));

      if (profileError) {
        // Retry on network/timeout errors
        if (retryAttempt < maxRetries && 
            (profileError.message?.includes('fetch') || 
             profileError.message?.includes('timeout') ||
             profileError.message?.includes('network'))) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return loadUserData(userId, retryAttempt + 1);
        }
        throw profileError;
      }
      
      setProfile(profileData);

      // User roles table was removed in cleanup
      // Check if user is admin by email
      const userEmail = profileData?.email?.toLowerCase();
      const isAdminUser = userEmail === 'ericexley@gmail.com';
      setUserRole({ user_id: userId, role: isAdminUser ? 'admin' : 'user' });
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't completely fail - user can still use the app without profile
      setProfile(null);
      setUserRole({ user_id: userId, role: 'user' });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, inviteCode: string) => {
    try {
      // Step 1: Validate invite code first
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', inviteCode)
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError) {
        console.error('Invite query error:', inviteError);
        if (inviteError.code === 'PGRST116') {
          return { error: { message: 'Invalid invite code' } };
        }
        return { error: { message: 'Error validating invite code: ' + inviteError.message } };
      }

      if (!invite) {
        console.error('No invite found for code:', inviteCode);
        return { error: { message: 'Invalid or expired invite code' } };
      }

      // Step 2: Create user account
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            invite_code: inviteCode,
            invited_by: invite.created_by
          }
        }
      });

      if (error) {
        console.error('Supabase auth.signUp error:', error);
        return { error: { message: 'Failed to create account: ' + error.message } };
      }

      if (!data.user) {
        console.error('No user returned from signup');
        return { error: { message: 'Failed to create user account' } };
      }

      // Step 3: Mark invite as used
      const { error: updateError } = await supabase
        .from('invites')
        .update({ 
          used_by: data.user.id, 
          used_at: new Date().toISOString() 
        })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Warning: Failed to update invite status:', updateError);
        // Don't fail the signup if invite update fails
      }

      // Step 4: Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Update profile with invite info if it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ invited_by: invite.created_by })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Warning: Failed to update profile:', profileError);
        // Don't fail the signup if profile update fails
      }

      return { error: null };
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Unexpected error during signup:', authError);
      return { error: { message: authError.message || 'An unexpected error occurred during signup' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const isAdmin = userRole?.role === 'admin';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        userRole,
        session, 
        loading, 
        signUp, 
        signIn, 
        signOut,
        isAdmin,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};