import React, { useState } from 'react';
import { X, Loader, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully' });
      
      // Clear form
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: unknown) {
      const resetError = error as { message?: string };
      console.error('Error updating password:', resetError);
      setMessage({ 
        type: 'error', 
        text: resetError.message || 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-forest-dark border border-forest-light rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-silver font-quicksand">Change Password</h2>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-silver/80 text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-forest-main text-silver px-3 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-silver/60 hover:text-silver"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-silver/80 text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-forest-main text-silver px-3 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-silver/60 hover:text-silver"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent-yellow text-forest-dark px-4 py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-forest-main text-silver px-4 py-2 rounded-lg font-quicksand font-medium hover:bg-forest-main/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetModal;