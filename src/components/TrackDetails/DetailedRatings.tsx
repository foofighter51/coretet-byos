import React, { useState } from 'react';
import { ThumbsUp, Heart } from 'lucide-react';
import { useRatingCategories } from '../../hooks/useCustomRatings';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Track, RatingCategory } from '../../types';

interface DetailedRatingsProps {
  track: Track;
}

interface TrackRating {
  category_id: string;
  rating_value: number; // 1 = liked, 2 = loved
}

const DetailedRatings: React.FC<DetailedRatingsProps> = ({ track }) => {
  const { categories, loading: categoriesLoading } = useRatingCategories(track.id);
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, TrackRating>>({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user && track.id) {
      fetchTrackRatings();
    }
  }, [track.id, user]);

  const fetchTrackRatings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('track_detailed_ratings')
        .select('*')
        .eq('track_id', track.id)
        .eq('user_id', user?.id);

      if (error) {
        // Table might not exist yet, fail silently
        console.log('Track ratings table not ready:', error);
        return;
      }

      if (data) {
        const ratingsMap: Record<string, TrackRating> = {};
        data.forEach(r => {
          ratingsMap[r.category_id] = {
            category_id: r.category_id,
            rating_value: r.rating_value
          };
        });
        setRatings(ratingsMap);
      }
    } catch (err) {
      console.error('Error fetching track ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = async (categoryId: string, value: number) => {
    if (!user) return;

    try {
      const currentRating = ratings[categoryId];
      
      // If clicking the same rating, remove it
      if (currentRating?.rating_value === value) {
        await supabase
          .from('track_detailed_ratings')
          .delete()
          .eq('track_id', track.id)
          .eq('category_id', categoryId)
          .eq('user_id', user.id);
        
        const newRatings = { ...ratings };
        delete newRatings[categoryId];
        setRatings(newRatings);
      } else {
        // Upsert rating
        const { data, error } = await supabase
          .from('track_detailed_ratings')
          .upsert({
            track_id: track.id,
            category_id: categoryId,
            user_id: user.id,
            rating_value: value,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (data) {
          setRatings({
            ...ratings,
            [categoryId]: {
              category_id: categoryId,
              rating_value: value
            }
          });
        }
      }
    } catch (err) {
      console.error('Error updating rating:', err);
    }
  };

  // Filter out production and originality
  const filteredCategories = categories.filter(cat => 
    cat.name !== 'production' && cat.name !== 'originality'
  );

  if (categoriesLoading || loading) {
    return (
      <div className="flex-1 border-2 border-accent-yellow rounded-lg p-4">
        <p className="text-silver/60 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 border-2 border-accent-yellow rounded-lg p-4">
      <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">
        Detailed Ratings
      </h3>

      <div className="space-y-1.5">
        {filteredCategories.length === 0 ? (
          <p className="text-silver/60 text-xs">No categories available</p>
        ) : (
          filteredCategories.map(category => {
            const currentRating = ratings[category.id]?.rating_value;
            
            return (
              <div key={category.id} className="flex items-center justify-between py-1">
                <span className="font-quicksand text-sm text-silver capitalize">
                  {category.name}
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Like button */}
                  <button
                    onClick={() => handleRatingClick(category.id, 1)}
                    className={`p-1 rounded transition-all ${
                      currentRating === 1
                        ? 'text-blue-500'
                        : 'text-silver/40 hover:text-silver/60'
                    }`}
                    title="Like"
                  >
                    <ThumbsUp 
                      size={16} 
                      className={currentRating === 1 ? 'fill-current' : ''}
                    />
                  </button>

                  {/* Love button */}
                  <button
                    onClick={() => handleRatingClick(category.id, 2)}
                    className={`p-1 rounded transition-all ${
                      currentRating === 2
                        ? 'text-red-500'
                        : 'text-silver/40 hover:text-silver/60'
                    }`}
                    title="Love"
                  >
                    <Heart 
                      size={16} 
                      className={currentRating === 2 ? 'fill-current' : ''}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DetailedRatings;