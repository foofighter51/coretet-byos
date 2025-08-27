import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, Pause } from 'lucide-react';
import { V2Layout } from '../components/Layout/V2Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../contexts/AudioContext';
import QuickUploadModal from '../components/Upload/QuickUploadModal';

interface Track {
  id: string;
  name: string;
  file_name: string;
  category: string;
  created_at: string;
  file_size: number;
  provider_url?: string;
  storage_path?: string;
}

export function WorksListV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const audio = useAudio();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Generate placeholder tracks for UI/UX testing
  const generatePlaceholderTracks = (): Track[] => {
    const trackNames = [
      "Summer Vibes Demo", "Midnight Blues", "Electric Dreams", "Acoustic Sunrise", "Urban Legends",
      "Neon Nights", "Coastal Breeze", "Mountain Echo", "Desert Storm", "Forest Walk",
      "City Lights", "Ocean Waves", "Starlit Sky", "Thunder Road", "Velvet Moon",
      "Golden Hour", "Silver Lining", "Crimson Dawn", "Emerald Rain", "Purple Haze",
      "Broken Hearts Club", "Dancing Shadows", "Whispered Secrets", "Faded Memories", "New Beginnings",
      "Lost in Translation", "Time Machine", "Digital Love", "Analog Soul", "Vintage Dreams",
      "Future Funk", "Retro Wave", "Cosmic Journey", "Space Oddity", "Alien Encounter",
      "Robot Dance", "Cyber Punk", "Neon Genesis", "Matrix Code", "Virtual Reality",
      "Quantum Leap", "Parallel Universe", "Time Paradox", "Reality Check", "Dream Sequence",
      "Midnight Snack", "Coffee Shop", "Rainy Day", "Sunny Afternoon", "Lazy Sunday",
      "Road Trip", "Flight Delay", "Hotel Room", "Taxi Ride", "Bus Stop"
    ];
    
    const categories = ["demos", "songs", "ideas", "voice-memos"];
    const artists = ["Band Name", "Solo Artist", "The Collective", "Studio Session", "Live Recording"];
    
    return trackNames.map((name, index) => ({
      id: `placeholder-${index}`,
      name,
      file_name: `${name.toLowerCase().replace(/\s+/g, '_')}.mp3`,
      category: categories[index % categories.length],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      file_size: Math.floor(Math.random() * 50000000) + 1000000, // 1MB - 50MB
      provider_url: `https://example.com/audio/${index}`,
      storage_path: `audio-files/${index}.mp3`
    }));
  };

  useEffect(() => {
    // Fetch tracks when component mounts
    fetchTracks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTracks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Combine real tracks with placeholder tracks for UI/UX testing
      const realTracks = data || [];
      const placeholderTracks = generatePlaceholderTracks();
      const allTracks = [...realTracks, ...placeholderTracks];
      
      setTracks(allTracks);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      // If DB fails, still show placeholder tracks for UI testing
      setTracks(generatePlaceholderTracks());
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const handleTrackDoubleClick = async (track: Track) => {
    try {
      // If this track is already playing, pause it
      if (audio.currentTrack === track.id && audio.isPlaying) {
        audio.pause();
        return;
      }

      // Play the track using global audio context
      await audio.playTrack(track.id);
      
    } catch (error) {
      console.error('❌ Error playing track:', error);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  // Estimate track duration from file size (rough approximation)
  const estimateDuration = (bytes: number) => {
    // Assume ~1MB per minute for compressed audio (very rough estimate)
    const estimatedMinutes = bytes / (1024 * 1024);
    const minutes = Math.floor(estimatedMinutes);
    const seconds = Math.floor((estimatedMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <V2Layout title="My Tracks" subtitle="Your uploaded tracks and demos">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-silver font-quicksand">Loading your tracks...</span>
        </div>
      </V2Layout>
    );
  }

  return (
    <V2Layout>
      {/* Track Count */}
      <div className="mb-8">
        <div className="text-sm text-silver/60 font-quicksand">
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} uploaded
        </div>
      </div>

      {tracks.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🎵</div>
          <h3 className="text-xl font-anton text-silver mb-3">No Tracks Yet</h3>
          <p className="font-quicksand text-silver/60 text-lg mb-8 max-w-md mx-auto">
            Ready to share with your band? Upload your first track and start collaborating.
          </p>
          <p className="font-quicksand text-silver/40 text-sm">
            Click "Upload Music" in the top bar to get started
          </p>
        </div>
      ) : (
        /* Tracks Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <div
              key={track.id}
              onDoubleClick={() => handleTrackDoubleClick(track)}
              className="group bg-forest-main border border-forest-light hover:border-accent-yellow rounded-lg p-6 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
            >
              {/* Track Info - Name, Duration, Type */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-anton text-lg text-white truncate group-hover:text-accent-yellow transition-colors">
                    {track.name}
                  </h3>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="font-quicksand text-silver/70">
                      {estimateDuration(track.file_size)}
                    </span>
                    <span className="font-quicksand text-xs text-silver/70 bg-forest-light px-2 py-1 rounded">
                      {track.category}
                    </span>
                  </div>
                  <span className="font-quicksand text-xs text-silver/50">
                    {formatDate(track.created_at)}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <QuickUploadModal onClose={() => {
          setShowUploadModal(false);
          fetchTracks(); // Refresh tracks after upload
        }} />
      )}
    </V2Layout>
  );
}