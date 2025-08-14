// Custom Rating System Types

export type RatingScaleType = 'numeric' | 'descriptive' | 'binary' | 'multi_state';

export interface RatingCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_by: string;
  track_id?: string;
  is_global: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface RatingScale {
  id: string;
  category_id: string;
  scale_type: RatingScaleType;
  min_value: number;
  max_value: number;
  scale_labels?: Record<string, string>; // e.g., {"1": "too slow", "2": "good", "3": "too fast"}
  default_value?: number;
  created_at: string;
  updated_at: string;
}

export interface SectionRating {
  id: string;
  section_id: string;
  category_id: string;
  user_id: string;
  rating_value?: number;
  rating_text?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackRatingScheme {
  id: string;
  track_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TrackRatingSchemeCategory {
  id: string;
  scheme_id: string;
  category_id: string;
  display_order: number;
  is_required: boolean;
  created_at: string;
}

export interface SectionRatingAggregate {
  id: string;
  section_id: string;
  category_id: string;
  avg_rating: number;
  total_ratings: number;
  rating_distribution: Record<string, number>; // e.g., {"1": 5, "2": 10, "3": 15}
  last_calculated: string;
}

// Extended types for UI usage
export interface RatingCategoryWithScale extends RatingCategory {
  scale?: RatingScale;
}

export interface AudioSectionWithRatings {
  id: string;
  track_id: string;
  name: string;
  start_time: number;
  end_time: number;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  ratings?: SectionRating[];
  userRatings?: Record<string, SectionRating>; // Keyed by category_id
  aggregates?: Record<string, SectionRatingAggregate>; // Keyed by category_id
}

export interface TrackWithCustomRatings {
  id: string;
  name: string;
  // ... other track fields
  rating_schemes?: TrackRatingScheme[];
  active_scheme?: TrackRatingScheme;
  sections?: AudioSectionWithRatings[];
}

// Helper types for filtering and smart playlists
export interface SectionRatingFilter {
  category_name?: string;
  category_id?: string;
  min_rating?: number;
  exact_rating?: number;
  user_id?: string;
  section_name?: string;
  time_range?: {
    start: number;
    end: number;
  };
}

export interface SmartPlaylistSectionCriteria {
  filters: SectionRatingFilter[];
  logic: 'AND' | 'OR';
  include_unrated?: boolean;
}

// Form types for UI components
export interface CreateRatingCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  track_id?: string;
  scale_type: RatingScaleType;
  min_value?: number;
  max_value?: number;
  scale_labels?: Record<string, string>;
}

export interface UpdateSectionRatingInput {
  section_id: string;
  category_id: string;
  rating_value?: number;
  rating_text?: string;
  notes?: string;
}

// Default rating categories (simplified)
export const DEFAULT_RATING_CATEGORIES: Partial<RatingCategory>[] = [
  { name: 'vibe' },
  { name: 'lyrics' },
  { name: 'melody' },
  { name: 'progression' },
  { name: 'rhythm' },
  { name: 'energy' },
];

// Utility type guards
export function isNumericScale(scale: RatingScale): boolean {
  return scale.scale_type === 'numeric';
}

export function isDescriptiveScale(scale: RatingScale): boolean {
  return scale.scale_type === 'descriptive';
}

export function hasUserRating(
  section: AudioSectionWithRatings,
  categoryId: string,
  userId?: string
): boolean {
  if (!section.userRatings) return false;
  return categoryId in section.userRatings;
}

export function getSectionAverageRating(
  section: AudioSectionWithRatings,
  categoryId: string
): number | null {
  if (!section.aggregates || !section.aggregates[categoryId]) return null;
  return section.aggregates[categoryId].avg_rating;
}