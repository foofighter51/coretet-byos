import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Create the main Supabase client with better mobile configuration
// Using <any, 'public', any> to bypass TypeScript cache issues
export const supabase = createClient<any, 'public', any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage, // Explicitly use localStorage
  },
  global: {
    fetch: (url, options = {}) => {
      // Add timeout to fetch requests (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
});

// Create admin client only if service key is available
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          storage_used: number;
          storage_limit: number;
          is_active: boolean;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          storage_used?: number;
          storage_limit?: number;
          is_active?: boolean;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          storage_used?: number;
          storage_limit?: number;
          is_active?: boolean;
          invited_by?: string | null;
          created_at?: string;
        };
      };
      tracks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          file_name: string;
          file_size: number;
          storage_path: string;
          duration: number | null;
          category: 'songs' | 'demos' | 'ideas' | 'voice-memos';
          tags: string[];
          artist?: string;
          collection?: string;
          genre?: string;
          tempo?: number;
          key?: string;
          listened?: boolean;
          liked?: boolean;
          loved?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          file_name: string;
          file_size: number;
          storage_path: string;
          duration?: number | null;
          category: 'songs' | 'demos' | 'ideas' | 'voice-memos';
          tags?: string[];
          artist?: string;
          collection?: string;
          genre?: string;
          tempo?: number;
          key?: string;
          listened?: boolean;
          liked?: boolean;
          loved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          file_name?: string;
          file_size?: number;
          storage_path?: string;
          duration?: number | null;
          category?: 'songs' | 'demos' | 'ideas' | 'voice-memos';
          tags?: string[];
          artist?: string;
          collection?: string;
          genre?: string;
          tempo?: number;
          key?: string;
          listened?: boolean;
          liked?: boolean;
          loved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invites: {
        Row: {
          id: string;
          code: string;
          email: string | null;
          used_by: string | null;
          created_by: string | null;
          used_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          email?: string | null;
          used_by?: string | null;
          created_by?: string | null;
          used_at?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          email?: string | null;
          used_by?: string | null;
          created_by?: string | null;
          used_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          user_id: string;
          role: 'user' | 'admin';
        };
        Insert: {
          user_id: string;
          role?: 'user' | 'admin';
        };
        Update: {
          user_id?: string;
          role?: 'user' | 'admin';
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      playlist_tracks: {
        Row: {
          id: string;
          playlist_id: string;
          track_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          track_id: string;
          position: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          track_id?: string;
          position?: number;
          added_at?: string;
        };
      };
    };
  };
};