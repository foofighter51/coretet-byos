import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Edit2, Trash2, RefreshCw, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

interface SmartPlaylist {
  id: string;
  name: string;
  description: string | null;
  criteria: any;
  is_active: boolean;
  max_tracks: number | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  created_at: string;
  updated_at: string;
}

interface SmartPlaylistsListProps {
  onEdit?: (playlist: SmartPlaylist) => void;
  onRunPlaylist?: (playlistId: string) => void;
}

export const SmartPlaylistsList: React.FC<SmartPlaylistsListProps> = ({ 
  onEdit, 
  onRunPlaylist 
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [playlists, setPlaylists] = useState<SmartPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningPlaylist, setRunningPlaylist] = useState<string | null>(null);
  const [materializingPlaylist, setMaterializingPlaylist] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSmartPlaylists();
    }
  }, [user]);

  const fetchSmartPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Smart playlists table not ready:', error);
        return;
      }

      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching smart playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (playlist: SmartPlaylist) => {
    try {
      const { error } = await supabase
        .from('smart_playlists')
        .update({ is_active: !playlist.is_active })
        .eq('id', playlist.id);

      if (error) throw error;

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlist.id 
            ? { ...p, is_active: !p.is_active }
            : p
        )
      );

      showToast(
        `Smart playlist ${!playlist.is_active ? 'activated' : 'deactivated'}`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling playlist:', error);
      showToast('Failed to update playlist', 'error');
    }
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this smart playlist?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('smart_playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      showToast('Smart playlist deleted', 'success');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast('Failed to delete playlist', 'error');
    }
  };

  const handleRunNow = async (playlistId: string) => {
    setRunningPlaylist(playlistId);
    try {
      // Get tracks matching the criteria
      const { data, error } = await supabase
        .rpc('get_smart_playlist_tracks', {
          p_playlist_id: playlistId
        });

      if (error) throw error;

      const trackCount = data?.length || 0;
      showToast(`Found ${trackCount} matching tracks`, 'success');
      
      if (onRunPlaylist) {
        onRunPlaylist(playlistId);
      }
    } catch (error) {
      console.error('Error running playlist:', error);
      showToast('Failed to run playlist', 'error');
    } finally {
      setRunningPlaylist(null);
    }
  };

  const handleMaterialize = async (playlistId: string) => {
    setMaterializingPlaylist(playlistId);
    try {
      const { data, error } = await supabase
        .rpc('materialize_smart_playlist', {
          p_smart_playlist_id: playlistId
        });

      if (error) throw error;

      showToast('Regular playlist created successfully!', 'success');
    } catch (error) {
      console.error('Error materializing playlist:', error);
      showToast('Failed to create regular playlist', 'error');
    } finally {
      setMaterializingPlaylist(null);
    }
  };

  const getCriteriaDescription = (criteria: any) => {
    const parts: string[] = [];
    
    if (criteria.ratings) {
      const ratingParts = Object.entries(criteria.ratings)
        .map(([category, req]: [string, any]) => {
          const level = req.min === 2 ? 'loved' : 'liked';
          return `${category} ${level}`;
        });
      if (ratingParts.length > 0) {
        parts.push(`Ratings: ${ratingParts.join(', ')}`);
      }
    }
    
    if (criteria.track_fields?.genre) {
      parts.push(`Genres: ${criteria.track_fields.genre.join(', ')}`);
    }
    
    if (criteria.track_fields?.tempo) {
      const { min, max } = criteria.track_fields.tempo;
      if (min && max) {
        parts.push(`Tempo: ${min}-${max} BPM`);
      } else if (min) {
        parts.push(`Tempo: ≥${min} BPM`);
      } else if (max) {
        parts.push(`Tempo: ≤${max} BPM`);
      }
    }
    
    if (criteria.general) {
      const generalParts = Object.entries(criteria.general)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      if (generalParts.length > 0) {
        parts.push(`Must be: ${generalParts.join(', ')}`);
      }
    }
    
    return parts.join(' • ') || 'No criteria set';
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-silver/60">
        Loading smart playlists...
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-silver/40" />
        <p className="text-silver/60 font-quicksand">
          No smart playlists yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {playlists.map(playlist => (
        <div
          key={playlist.id}
          className={`bg-forest-light rounded-lg p-4 transition-opacity ${
            !playlist.is_active ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-anton text-lg text-silver flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-yellow" />
                {playlist.name}
                {!playlist.is_active && (
                  <span className="text-xs font-quicksand text-silver/60 ml-2">
                    (Inactive)
                  </span>
                )}
              </h3>
              {playlist.description && (
                <p className="text-sm text-silver/80 font-quicksand mt-1">
                  {playlist.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(playlist)}
                className="p-1.5 text-silver hover:text-accent-yellow transition-colors"
                title={playlist.is_active ? 'Deactivate' : 'Activate'}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              {onEdit && (
                <button
                  onClick={() => onEdit(playlist)}
                  className="p-1.5 text-silver hover:text-accent-yellow transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => handleDelete(playlist.id)}
                className="p-1.5 text-silver hover:text-accent-coral transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="text-sm text-silver/60 font-quicksand mb-3">
            {getCriteriaDescription(playlist.criteria)}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-silver/40 font-quicksand">
              {playlist.max_tracks && `Max ${playlist.max_tracks} tracks • `}
              Sort by {playlist.sort_by} ({playlist.sort_order})
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRunNow(playlist.id)}
                disabled={runningPlaylist === playlist.id || !playlist.is_active}
                className="px-3 py-1.5 bg-forest-main text-silver rounded text-sm font-quicksand hover:bg-forest-main/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                {runningPlaylist === playlist.id ? 'Running...' : 'Preview'}
              </button>
              
              <button
                onClick={() => handleMaterialize(playlist.id)}
                disabled={materializingPlaylist === playlist.id || !playlist.is_active}
                className="px-3 py-1.5 bg-accent-yellow text-forest-dark rounded text-sm font-quicksand font-bold hover:bg-accent-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <List className="w-3 h-3" />
                {materializingPlaylist === playlist.id ? 'Creating...' : 'Create Playlist'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};