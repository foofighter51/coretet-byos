import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Track, AudioSection } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../contexts/AudioContext';
import ArrangementWaveform from './ArrangementWaveform';
import SectionMarker from './SectionMarker';
import SectionList from './SectionList';
import { useToast } from '../../contexts/ToastContext';

interface ArrangementEditorProps {
  track: Track;
  onClose?: () => void;
}

const ArrangementEditor: React.FC<ArrangementEditorProps> = ({ track, onClose }) => {
  const { user } = useAuth();
  const { duration, play, pause, isPlaying, currentTrack } = useAudio();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [sections, setSections] = useState<AudioSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [createStart, setCreateStart] = useState<number | null>(null);
  const [_isLoading, setIsLoading] = useState(true);

  // Load existing sections
  useEffect(() => {
    loadSections();
    // Test RLS policies
    testRLSPolicies();
  }, [track.id]);

  const testRLSPolicies = async () => {
    // Testing RLS policies for audio_sections table
    
    // Test 1: Read from audio_sections
    const { data: _readTest, error: _readError } = await supabase
      .from('audio_sections')
      .select('*')
      .limit(1);
    
    // Test 1b: Query user tracks
    const { data: _myTracks, error: _myTracksError } = await supabase
      .from('tracks')
      .select('id, user_id')
      .eq('user_id', user?.id)
      .limit(5);
    
    // Test 2: Get current user
    const { data: { user: _currentUser } } = await supabase.auth.getUser();
    
    // Test 3: Check track ownership
    const { data: _trackOwnership, error: _ownershipError } = await supabase
      .from('tracks')
      .select('id, user_id')
      .eq('id', track.id)
      .single();
  };

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_sections')
        .select('*')
        .eq('track_id', track.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new section
  const handleCreateSection = useCallback(async (startTime: number, endTime: number) => {
    if (!user) {
      showToast('Please log in to create sections', 'error');
      return;
    }

    try {
      const sectionNumber = sections.length + 1;
      const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
      
      // First, verify the current session
      const { data: { session }, error: _sessionError } = await supabase.auth.getSession();
      
      if (!session || _sessionError) {
        showToast('Session expired. Please refresh the page and try again.', 'error');
        return;
      }
      
      const _newSection = {
        track_id: track.id,
        name: `Section ${sectionNumber}`,
        start_time: startTime,
        end_time: endTime,
        color: colors[sectionNumber % colors.length],
        created_by: session.user.id  // Use session user ID directly
      };
      
      // Inserting section

      // Try a minimal insert first
      const minimalSection = {
        track_id: track.id,
        name: `Section ${sectionNumber}`,
        start_time: startTime,
        end_time: endTime,
        color: colors[sectionNumber % colors.length]
        // Omit created_by to let database default handle it
      };
      
      // Trying minimal insert
      
      // Check for valid session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Try manually setting auth header if needed
      if (currentSession?.access_token) {
        // Try using RPC function instead of direct insert
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('create_audio_section', {
            p_track_id: track.id,
            p_name: `Section ${sectionNumber}`,
            p_start_time: startTime,
            p_end_time: endTime,
            p_color: colors[sectionNumber % colors.length]
          });
        
        if (rpcError) {
          // Fall back to direct insert
          const { data: insertData, error: insertError } = await supabase
            .from('audio_sections')
            .insert(minimalSection)
            .select();
          
          if (insertError) {
            throw insertError;
          }
          
          return insertData;
        }
        
        // Handle success
        const createdSection = rpcData || insertData;
        if (createdSection) {
          setSections(prev => [...prev, createdSection].sort((a, b) => a.start_time - b.start_time));
          setSelectedSection(createdSection.id);
          showToast('Section created successfully', 'success');
        }
      } else {
        // No access token available
        throw new Error('Authentication lost - please refresh the page');
      }
    } catch (error: unknown) {
      const sectionError = error as { message?: string };
      console.error('Error creating section:', sectionError);
      
      // Check if it's an RLS policy error
      if (sectionError.message?.includes('row-level security policy')) {
        // RLS policy error - check track ownership
        
        // Get session again for debugging
        const { data: { session } } = await supabase.auth.getSession();
        
        // Verify track ownership
        const { data: trackData, error: trackError } = await supabase
          .from('tracks')
          .select('user_id')
          .eq('id', track.id)
          .single();
        
        if (trackError) {
          showToast('Unable to verify track ownership. Please try again.', 'error');
        } else if (trackData && trackData.user_id !== user.id) {
          showToast('You can only create sections for your own tracks', 'error');
        } else {
          showToast('Permission denied. Please ensure you are logged in and this is your track.', 'error');
        }
      } else {
        showToast(`Failed to create section: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  }, [user, track.id, sections.length, showToast]);

  // Update section
  const handleUpdateSection = useCallback(async (updatedSection: AudioSection) => {
    try {
      const { error } = await supabase
        .from('audio_sections')
        .update({
          name: updatedSection.name,
          start_time: updatedSection.start_time,
          end_time: updatedSection.end_time,
          color: updatedSection.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedSection.id);

      if (error) throw error;
      
      setSections(prev => 
        prev.map(s => s.id === updatedSection.id ? updatedSection : s)
          .sort((a, b) => a.start_time - b.start_time)
      );
    } catch (error) {
      console.error('Error updating section:', error);
      showToast('Failed to update section', 'error');
    }
  }, []);

  // Delete section
  const handleDeleteSection = useCallback(async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('audio_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      
      setSections(prev => prev.filter(s => s.id !== sectionId));
      if (selectedSection === sectionId) {
        setSelectedSection(null);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      showToast('Failed to delete section', 'error');
    }
  }, [selectedSection]);


  // Play/pause from current position
  const togglePlayback = () => {
    if (currentTrack === track.id && isPlaying) {
      pause();
    } else {
      play(track.id, track.url);
    }
  };

  // Play specific section
  const playSection = (section: AudioSection) => {
    // This would require enhancing the audio context to support
    // playing from a specific time and stopping at another
    // TODO: Implement section playback
  };

  return (
    <div className="flex flex-col h-full bg-forest-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-forest-main border-b border-forest-light">
        <div>
          <h2 className="text-xl font-anton text-silver">Arrangement Editor</h2>
          <p className="text-sm text-silver/60">{track.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlayback}
            className="flex items-center space-x-2 px-4 py-2 bg-forest-light hover:bg-forest-light/80 rounded-lg transition-colors"
          >
            {isPlaying && currentTrack === track.id ? (
              <Pause className="w-4 h-4 text-silver" />
            ) : (
              <Play className="w-4 h-4 text-silver" />
            )}
            <span className="text-sm text-silver">
              {isPlaying && currentTrack === track.id ? 'Pause' : 'Play'}
            </span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-silver/60 hover:text-silver"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Waveform and Sections */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-forest-light/50 rounded-lg p-4">
              <p className="text-sm text-silver/80">
                {isCreatingSection 
                  ? "Click again to mark the end of the section"
                  : sections.length === 0 
                    ? "Click on the waveform to mark the start and end of your first section"
                    : "Click on sections to select and edit them. Create new sections by clicking in empty areas."}
              </p>
            </div>

            {/* Waveform with sections */}
            <div 
              ref={containerRef}
              className="relative cursor-crosshair"
            >
              <ArrangementWaveform
                track={track}
                height={200}
                onSeek={(time) => {
                  // Waveform clicked at time
                  // Convert time to click position for section creation
                  if (isCreatingSection && createStart !== null) {
                    // Completing section creation
                    const endTime = Math.max(time, createStart + 0.5);
                    handleCreateSection(Math.min(createStart, time), endTime);
                    setIsCreatingSection(false);
                    setCreateStart(null);
                  } else {
                    // Starting section creation
                    setIsCreatingSection(true);
                    setCreateStart(time);
                  }
                }}
              />
              
              {/* Section markers overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {sections.map(section => (
                  <div key={section.id} className="pointer-events-auto">
                    <SectionMarker
                      section={section}
                      totalDuration={duration || 1}
                      containerWidth={containerRef.current?.offsetWidth || 800}
                      onUpdate={handleUpdateSection}
                      onDelete={handleDeleteSection}
                      isSelected={selectedSection === section.id}
                      onSelect={() => setSelectedSection(section.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Section creation preview */}
              {isCreatingSection && createStart !== null && (
                <div
                  className="absolute top-0 h-full bg-accent-yellow/20 border-2 border-accent-yellow border-dashed"
                  style={{
                    left: `${(createStart / (duration || 1)) * 100}%`,
                    width: '2px'
                  }}
                />
              )}
            </div>

            {/* Section List */}
            <SectionList
              sections={sections}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
              onPlaySection={playSection}
            />
          </div>
        </div>

        {/* Arrangement Builder (future feature) */}
        <div className="w-80 bg-forest-main border-l border-forest-light p-4">
          <h3 className="font-quicksand font-semibold text-silver mb-4">
            Arrangements
          </h3>
          <p className="text-sm text-silver/60">
            Arrangement building coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArrangementEditor;