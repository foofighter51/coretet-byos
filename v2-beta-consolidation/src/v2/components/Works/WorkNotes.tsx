import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface WorkNotesProps {
  workId: string;
}

/**
 * WorkNotes - Notes management for a work
 */
export default function WorkNotes({ workId }: WorkNotesProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [workId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // Get project to extract notes from metadata
      const { data: project, error } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', workId)
        .single();

      if (error) throw error;

      // Parse notes from metadata
      const metadata = project?.metadata as any || {};
      const notesArray = metadata.notes || [];
      
      setNotes(notesArray);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;

    try {
      const newNoteObj: Note = {
        id: `note_${Date.now()}`,
        content: newNote.trim(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Unknown'
      };

      // Get current project metadata
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', workId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = project?.metadata as any || {};
      const currentNotes = metadata.notes || [];
      
      // Add new note at the beginning
      const updatedNotes = [newNoteObj, ...currentNotes];

      // Update project metadata with new notes
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          metadata: {
            ...metadata,
            notes: updatedNotes
          }
        })
        .eq('id', workId);

      if (updateError) throw updateError;

      setNotes(updatedNotes);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      // Get current project metadata
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', workId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = project?.metadata as any || {};
      const currentNotes = metadata.notes || [];
      
      // Remove the note
      const updatedNotes = currentNotes.filter((n: Note) => n.id !== noteId);

      // Update project metadata
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          metadata: {
            ...metadata,
            notes: updatedNotes
          }
        })
        .eq('id', workId);

      if (updateError) throw updateError;

      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-forest-main border border-forest-light rounded-xl p-6">
        <div className="text-center py-8">
          <p className="font-quicksand text-silver/60">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Add New Note */}
      <div className="lg:col-span-1">
        <div className="bg-forest-main border border-forest-light rounded-xl p-6">
          <h3 className="font-anton text-lg text-silver mb-4">Add Note</h3>
          <div className="space-y-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && newNote.trim()) {
                  e.preventDefault();
                  addNote();
                }
              }}
              placeholder="Write a note about this work... (Press Enter to save, Shift+Enter for new line)"
              rows={6}
              className="w-full px-4 py-3 bg-forest-dark border border-forest-light rounded-lg font-quicksand text-silver placeholder:text-silver/40 focus:outline-none focus:border-accent-yellow resize-none"
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="w-full px-4 py-2 bg-accent-yellow text-forest-dark font-quicksand font-semibold rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="lg:col-span-2">
        <div className="bg-forest-main border border-forest-light rounded-xl p-6">
          <h3 className="font-anton text-lg text-silver mb-4">Notes</h3>
          
          {notes.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className="bg-forest-dark rounded-lg p-4 hover:bg-forest-dark/70 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 text-silver/60">
                        <User className="w-3 h-3" />
                        <span className="font-quicksand text-xs">{note.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-silver/60">
                        <Calendar className="w-3 h-3" />
                        <span className="font-quicksand text-xs">{formatDate(note.created_at)}</span>
                      </div>
                    </div>
                    {note.user_id === user?.id && (
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-silver/40 hover:text-accent-coral p-1"
                        title="Delete note"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="font-quicksand text-sm text-silver whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-quicksand text-silver/60 mb-2">No notes yet</p>
              <p className="font-quicksand text-sm text-silver/40">
                Add notes to track ideas, lyrics, and progress
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}