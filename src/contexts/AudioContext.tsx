import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getStreamingUrl } from '../utils/getStreamingUrl';
import { useLibrary } from './LibraryContext';

interface AudioContextType {
  currentTrack: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (trackId: string, url: string) => void;
  playTrack: (trackId: string) => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  onTrackEnd?: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

// URL cache to avoid repeated edge function calls
const urlCache: Record<string, { url: string; expires: number }> = {};

export const AudioProvider: React.FC<{ children: React.ReactNode; onTrackEnd?: () => void }> = ({ children, onTrackEnd }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const { tracks } = useLibrary();

  const play = useCallback(async (trackId: string, url: string) => {
    // Use the URL directly - getStreamingUrl has already handled URL generation
    
    if (audioRef.current) {
      // If it's the same track, just resume playback
      if (currentTrack === trackId) {
        audioRef.current.play().catch(err => console.error('Play error:', err));
        setIsPlaying(true);
        return;
      }
      
      audioRef.current.pause();
      audioRef.current.src = url;
      setCurrentTrack(trackId);
      
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
        audioRef.current?.play()
          .then(() => {
            setIsPlaying(true);
            // Update media session if available
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing';
            }
          })
          .catch(err => {
            console.error('Play error after metadata:', err);
            // For mobile browsers that require user interaction
            if (err.name === 'NotAllowedError') {
              // Playbook requires user interaction
            }
          });
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio error:', e, 'URL:', url);
      };
      
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onTrackEnd?.();
      };
    } else {
      // Creating new audio element
      audioRef.current = new Audio(url);
      audioRef.current.volume = volume;
      setCurrentTrack(trackId);
      
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
        audioRef.current?.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Play error after metadata:', err));
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio error:', e, 'URL:', url);
      };
      
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onTrackEnd?.();
      };
    }
  }, [currentTrack, volume, onTrackEnd]);

  // BYOS-aware playTrack method that handles multiple storage providers
  const playTrack = useCallback(async (trackId: string) => {
    
    // If same track, just resume
    if (currentTrack === trackId && audioRef.current?.src) {
      audioRef.current.play().catch(err => console.error('Play error:', err));
      setIsPlaying(true);
      return;
    }

    // Find the track in our library
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      console.error('Track not found:', trackId);
      return;
    }

    try {
      console.log('🎵 AudioContext: Getting streaming URL for track:', track);
      // Get streaming URL based on storage provider
      const streamingUrl = await getStreamingUrl(track);
      
      console.log('📡 AudioContext: Received streaming URL:', streamingUrl);
      
      if (!streamingUrl) {
        console.error('Failed to get streaming URL for track:', trackId);
        return;
      }

      console.log('Playing track with URL:', streamingUrl);
      
      // Play the track with the streaming URL
      play(trackId, streamingUrl);
    } catch (error) {
      console.error('Error getting streaming URL:', error);
      return;
    }
  }, [currentTrack, play, tracks]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Update media session if available
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Wake lock to prevent screen sleep during playback
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isPlaying) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Wake lock failed
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isPlaying]);

  // Setup media session handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current && currentTrack) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          seek(details.seekTime);
        }
      });
    } catch (error) {
      // Media session setup error
    }
  }, [currentTrack, pause, seek]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        play,
        playTrack,
        pause,
        seek,
        setVolume,
        onTrackEnd,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};