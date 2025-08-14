import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type SortOption = 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration' | 'date' | 'manual';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid';

interface ViewPreferences {
  sortBy: SortOption;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  manualPositions?: Record<string, number>; // trackId -> position for manual overrides
}

interface ViewContext {
  type: 'category' | 'playlist' | 'collection' | 'rating' | 'tags';
  id: string; // category name, playlist id, collection name, etc.
}

const DEFAULT_PREFERENCES: ViewPreferences = {
  sortBy: 'added',
  sortDirection: 'desc',
  viewMode: 'list'
};

const PLAYLIST_DEFAULT_PREFERENCES: ViewPreferences = {
  sortBy: 'manual',
  sortDirection: 'asc',
  viewMode: 'list'
};

// Generate a unique key for localStorage (fallback)
const getPreferenceKey = (context: ViewContext): string => {
  return `coretet_view_${context.type}_${context.id}`;
};

export const useViewPreferences = (context: ViewContext | null) => {
  const { user } = useAuth();
  const getDefaultPreferences = () => {
    if (context?.type === 'playlist' || context?.type === 'collection') {
      return PLAYLIST_DEFAULT_PREFERENCES;
    }
    return DEFAULT_PREFERENCES;
  };
  
  const [preferences, setPreferences] = useState<ViewPreferences>(getDefaultPreferences());
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database when context changes
  useEffect(() => {
    if (!context || !user) {
      setPreferences(getDefaultPreferences());
      setIsLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('view_preferences')
          .select('*')
          .eq('view_type', context.type)
          .eq('view_id', context.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows

        if (error) {
          console.error('Error loading view preferences:', error);
        }

        if (data) {
          setPreferences({
            sortBy: data.sort_by as SortOption,
            sortDirection: data.sort_direction as SortDirection,
            viewMode: data.view_mode as ViewMode,
            manualPositions: data.manual_positions || undefined
          });
        } else {
          // Try localStorage fallback for migration
          const key = getPreferenceKey(context);
          const stored = localStorage.getItem(key);
          
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const migrated = { ...DEFAULT_PREFERENCES, ...parsed };
              setPreferences(migrated);
              
              // Save to database for future use
              await savePreferencesToDb(context, migrated, user.id);
              
              // Remove from localStorage after successful migration
              localStorage.removeItem(key);
            } catch (e) {
              console.error('Failed to parse stored preferences:', e);
              setPreferences(getDefaultPreferences());
            }
          } else {
            setPreferences(getDefaultPreferences());
          }
        }
      } catch (error) {
        console.error('Error in loadPreferences:', error);
        setPreferences(getDefaultPreferences());
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [context?.type, context?.id, user]);

  // Helper function to save preferences to database
  const savePreferencesToDb = async (
    ctx: ViewContext,
    prefs: ViewPreferences,
    _userId: string
  ) => {
    try {
      const { error } = await supabase.rpc('upsert_view_preference', {
        p_view_type: ctx.type,
        p_view_id: ctx.id,
        p_sort_by: prefs.sortBy,
        p_sort_direction: prefs.sortDirection,
        p_view_mode: prefs.viewMode,
        p_manual_positions: prefs.manualPositions || null
      });

      if (error) {
        // If the RPC function doesn't exist, silently fail
        // The app will still work with local state
        if (error.message?.includes('function')) {
          console.warn('Cannot save view preferences to database. Using local state only.');
          // Save to localStorage as fallback
          const key = getPreferenceKey(ctx);
          localStorage.setItem(key, JSON.stringify(prefs));
          return;
        }
        console.error('Error saving view preferences:', error);
      }
    } catch (error) {
      console.error('Error calling upsert_view_preference:', error);
      // Fallback to localStorage
      const key = getPreferenceKey(ctx);
      localStorage.setItem(key, JSON.stringify(prefs));
    }
  };

  // Save preferences to database whenever they change
  const updatePreferences = useCallback((updates: Partial<ViewPreferences>) => {
    if (!context || !user) return;

    setPreferences(current => {
      const updated = { ...current, ...updates };
      
      // Save to database asynchronously
      savePreferencesToDb(context, updated, user.id);
      
      return updated;
    });
  }, [context, user]);

  // Update manual position for a track
  const updateManualPosition = useCallback((trackId: string, position: number) => {
    if (!context || !user) return;

    setPreferences(current => {
      const manualPositions = { ...current.manualPositions, [trackId]: position };
      const updated = { ...current, manualPositions };
      
      // Save to database asynchronously
      savePreferencesToDb(context, updated, user.id);
      
      return updated;
    });
  }, [context, user]);

  // Remove manual position for a track
  const removeManualPosition = useCallback((trackId: string) => {
    if (!context || !user) return;

    setPreferences(current => {
      const manualPositions = { ...current.manualPositions };
      delete manualPositions[trackId];
      const updated = { ...current, manualPositions };
      
      // Save to database asynchronously
      savePreferencesToDb(context, updated, user.id);
      
      return updated;
    });
  }, [context, user]);

  // Clear all manual positions (reset to pure sort)
  const clearManualPositions = useCallback(() => {
    if (!context || !user) return;

    setPreferences(current => {
      const updated = { ...current, manualPositions: undefined };
      
      // Save to database asynchronously
      savePreferencesToDb(context, updated, user.id);
      
      return updated;
    });
  }, [context, user]);

  return {
    ...preferences,
    isLoading,
    updatePreferences,
    updateManualPosition,
    removeManualPosition,
    clearManualPositions
  };
};

// Helper to determine the current view context based on props
export const getViewContext = (
  category: string,
  selectedPlaylist: string | null,
  selectedCollection: string | null,
  selectedRating: string | null,
  selectedTags: string[]
): ViewContext | null => {
  if (selectedPlaylist) {
    return { type: 'playlist', id: selectedPlaylist };
  }
  if (selectedCollection) {
    return { type: 'collection', id: selectedCollection };
  }
  if (selectedRating) {
    return { type: 'rating', id: selectedRating };
  }
  if (selectedTags.length > 0) {
    // Create a stable ID from sorted tags
    return { type: 'tags', id: selectedTags.sort().join(',') };
  }
  if (category && category !== 'all') {
    return { type: 'category', id: category };
  }
  return { type: 'category', id: 'all' };
};