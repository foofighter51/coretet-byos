import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type {
  RatingCategory,
  RatingCategoryWithScale,
  SectionRating,
  UpdateSectionRatingInput,
  AudioSectionWithRatings,
  SectionRatingAggregate,
  RatingScale,
} from '../types/customRatings';

export function useRatingCategories(trackId?: string) {
  const [categories, setCategories] = useState<RatingCategoryWithScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch categories (global or track-specific)
      let query = supabase
        .from('rating_categories')
        .select(`
          *,
          rating_scales (*)
        `)
        .order('display_order', { ascending: true });

      if (trackId) {
        // Get track-specific and global categories
        query = query.or(`track_id.eq.${trackId},is_global.eq.true`);
      } else {
        // Just get global categories
        query = query.eq('is_global', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.log('Rating categories not ready:', fetchError);
        return;
      }

      // Transform data to include scale
      const categoriesWithScale: RatingCategoryWithScale[] = (data || []).map(cat => ({
        ...cat,
        scale: cat.rating_scales?.[0] || undefined,
      }));

      setCategories(categoriesWithScale);
    } catch (err) {
      console.log('Error fetching rating categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      // Don't show toast for missing tables
    } finally {
      setLoading(false);
    }
  }, [user, trackId, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (
    name: string,
    description?: string,
    icon?: string,
    color?: string,
    scaleType: 'numeric' | 'descriptive' = 'numeric',
    scaleOptions?: Partial<RatingScale>
  ) => {
    if (!user) return null;

    try {
      // Create the category
      const { data: category, error: categoryError } = await supabase
        .from('rating_categories')
        .insert({
          name,
          description,
          icon,
          color,
          track_id: trackId,
          created_by: user.id,
          is_global: false,
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Create the scale
      const { data: scale, error: scaleError } = await supabase
        .from('rating_scales')
        .insert({
          category_id: category.id,
          scale_type: scaleType,
          min_value: scaleOptions?.min_value || 1,
          max_value: scaleOptions?.max_value || 5,
          scale_labels: scaleOptions?.scale_labels,
          default_value: scaleOptions?.default_value,
        })
        .select()
        .single();

      if (scaleError) throw scaleError;

      const newCategory: RatingCategoryWithScale = {
        ...category,
        scale,
      };

      setCategories(prev => [...prev, newCategory]);
      showToast('Rating category created', 'success');
      return newCategory;
    } catch (err) {
      console.error('Error creating category:', err);
      showToast('Failed to create category', 'error');
      return null;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('rating_categories')
        .delete()
        .eq('id', categoryId)
        .eq('created_by', user?.id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== categoryId));
      showToast('Category deleted', 'success');
    } catch (err) {
      console.error('Error deleting category:', err);
      showToast('Failed to delete category', 'error');
    }
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}

export function useSectionRatings(sectionId: string) {
  const [ratings, setRatings] = useState<Record<string, SectionRating>>({});
  const [aggregates, setAggregates] = useState<Record<string, SectionRatingAggregate>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchRatings = useCallback(async () => {
    if (!user || !sectionId) return;

    try {
      setLoading(true);

      // Fetch user's ratings for this section
      const { data: userRatings, error: ratingsError } = await supabase
        .from('section_ratings')
        .select('*')
        .eq('section_id', sectionId)
        .eq('user_id', user.id);

      if (ratingsError) throw ratingsError;

      // Fetch aggregates for this section
      const { data: sectionAggregates, error: aggregatesError } = await supabase
        .from('section_rating_aggregates')
        .select('*')
        .eq('section_id', sectionId);

      if (aggregatesError) throw aggregatesError;

      // Transform to keyed objects
      const ratingsMap: Record<string, SectionRating> = {};
      userRatings?.forEach(rating => {
        ratingsMap[rating.category_id] = rating;
      });

      const aggregatesMap: Record<string, SectionRatingAggregate> = {};
      sectionAggregates?.forEach(agg => {
        aggregatesMap[agg.category_id] = agg;
      });

      setRatings(ratingsMap);
      setAggregates(aggregatesMap);
    } catch (err) {
      console.error('Error fetching section ratings:', err);
      showToast('Failed to load ratings', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, sectionId, showToast]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const updateRating = async (input: UpdateSectionRatingInput) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('section_ratings')
        .upsert({
          section_id: input.section_id,
          category_id: input.category_id,
          user_id: user.id,
          rating_value: input.rating_value,
          rating_text: input.rating_text,
          notes: input.notes,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setRatings(prev => ({
        ...prev,
        [input.category_id]: data,
      }));

      // Refetch aggregates (they're updated by trigger)
      const { data: newAggregate } = await supabase
        .from('section_rating_aggregates')
        .select('*')
        .eq('section_id', input.section_id)
        .eq('category_id', input.category_id)
        .single();

      if (newAggregate) {
        setAggregates(prev => ({
          ...prev,
          [input.category_id]: newAggregate,
        }));
      }

      showToast('Rating updated', 'success');
    } catch (err) {
      console.error('Error updating rating:', err);
      showToast('Failed to update rating', 'error');
    }
  };

  const deleteRating = async (categoryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('section_ratings')
        .delete()
        .eq('section_id', sectionId)
        .eq('category_id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setRatings(prev => {
        const newRatings = { ...prev };
        delete newRatings[categoryId];
        return newRatings;
      });

      showToast('Rating removed', 'success');
    } catch (err) {
      console.error('Error deleting rating:', err);
      showToast('Failed to remove rating', 'error');
    }
  };

  return {
    ratings,
    aggregates,
    loading,
    updateRating,
    deleteRating,
    refetch: fetchRatings,
  };
}

export function useTrackSectionRatings(trackId: string) {
  const [sections, setSections] = useState<AudioSectionWithRatings[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSectionsWithRatings = useCallback(async () => {
    if (!user || !trackId) return;

    try {
      setLoading(true);

      // Fetch sections with their ratings
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('audio_sections')
        .select(`
          *,
          section_ratings!section_ratings_section_id_fkey (
            *
          ),
          section_rating_aggregates!section_rating_aggregates_section_id_fkey (
            *
          )
        `)
        .eq('track_id', trackId)
        .order('start_time', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Transform data
      const sectionsWithRatings: AudioSectionWithRatings[] = (sectionsData || []).map(section => {
        const userRatings: Record<string, SectionRating> = {};
        const aggregates: Record<string, SectionRatingAggregate> = {};

        // Filter user ratings
        section.section_ratings?.forEach((rating: SectionRating) => {
          if (rating.user_id === user.id) {
            userRatings[rating.category_id] = rating;
          }
        });

        // Map aggregates
        section.section_rating_aggregates?.forEach((agg: SectionRatingAggregate) => {
          aggregates[agg.category_id] = agg;
        });

        return {
          id: section.id,
          track_id: section.track_id,
          name: section.name,
          start_time: section.start_time,
          end_time: section.end_time,
          color: section.color,
          created_by: section.created_by,
          created_at: section.created_at,
          updated_at: section.updated_at,
          userRatings,
          aggregates,
        };
      });

      setSections(sectionsWithRatings);
    } catch (err) {
      console.error('Error fetching track sections with ratings:', err);
    } finally {
      setLoading(false);
    }
  }, [user, trackId]);

  useEffect(() => {
    fetchSectionsWithRatings();
  }, [fetchSectionsWithRatings]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!trackId) return;

    const channel = supabase
      .channel(`track-sections-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'section_ratings',
          filter: `section_id=in.(${sections.map(s => s.id).join(',')})`,
        },
        () => {
          fetchSectionsWithRatings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, sections, fetchSectionsWithRatings]);

  return {
    sections,
    loading,
    refetch: fetchSectionsWithRatings,
  };
}

// Hook for smart playlist filtering based on section ratings
export function useSmartSectionFiltering() {
  const { user } = useAuth();

  const getTracksWithRatedSections = async (
    categoryName: string,
    minRating?: number,
    exactRating?: number
  ) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('get_sections_by_rating', {
        p_category_name: categoryName,
        p_min_rating: minRating,
        p_rating_value: exactRating,
        p_user_id: user.id,
      });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching tracks with rated sections:', err);
      return [];
    }
  };

  const getTracksWithAnyLovedSection = async () => {
    // This would need a custom RPC function or complex query
    // For now, we'll fetch all loved sections across all categories
    try {
      const { data, error } = await supabase
        .from('section_ratings')
        .select(`
          section_id,
          audio_sections!inner(
            track_id,
            name,
            start_time,
            end_time
          )
        `)
        .eq('user_id', user?.id)
        .eq('rating_value', 5); // Assuming 5 is "loved"

      if (error) throw error;

      // Group by track_id
      const trackMap = new Map<string, any[]>();
      data?.forEach(item => {
        const trackId = item.audio_sections.track_id;
        if (!trackMap.has(trackId)) {
          trackMap.set(trackId, []);
        }
        trackMap.get(trackId)?.push(item);
      });

      return Array.from(trackMap.keys());
    } catch (err) {
      console.error('Error fetching tracks with loved sections:', err);
      return [];
    }
  };

  return {
    getTracksWithRatedSections,
    getTracksWithAnyLovedSection,
  };
}