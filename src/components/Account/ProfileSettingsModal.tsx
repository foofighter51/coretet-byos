import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() || null })
        .eq('id', profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Refresh the profile data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-forest-dark border border-forest-light rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-silver font-quicksand">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-silver/80 text-sm font-medium mb-2">
              Email
            </label>
            <div className="bg-forest-main px-3 py-2 rounded-lg text-silver/60">
              {profile?.email}
            </div>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-silver/80 text-sm font-medium mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full bg-forest-main text-silver px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow"
            />
            <p className="text-silver/60 text-xs mt-1">
              This name will be shown to others when you share playlists
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-900/20 text-green-400 border border-green-800' 
                : 'bg-red-900/20 text-red-400 border border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-accent-yellow text-forest-dark px-4 py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-forest-main text-silver px-4 py-2 rounded-lg font-quicksand font-medium hover:bg-forest-main/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;