import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useCollaborator } from '../../contexts/CollaboratorContext';
import { supabase } from '../../lib/supabase';

interface CollaboratorAuthProps {
  shareToken?: string;
}

interface ShareInfo {
  playlist_name: string;
  shared_by_email: string;
  shared_with_email: string;
}

const CollaboratorAuth: React.FC<CollaboratorAuthProps> = ({ shareToken }) => {
  const navigate = useNavigate();
  const { login, signup, collaborator } = useCollaborator();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loadingShare, setLoadingShare] = useState(true);

  useEffect(() => {
    if (collaborator) {
      navigate('/collaborate');
    }
  }, [collaborator, navigate]);

  useEffect(() => {
    if (shareToken) {
      validateShareToken();
    } else {
      setLoadingShare(false);
    }
  }, [shareToken]);

  const validateShareToken = async () => {
    try {
      const { data, error } = await supabase
        .rpc('validate_share_token', { p_token: shareToken })
        .single();

      if (error || !data) {
        setError('Invalid or expired invitation');
        setLoadingShare(false);
        return;
      }

      // Get more info about the share
      const { data: shareData } = await supabase
        .from('playlist_shares')
        .select(`
          shared_with_email,
          playlists!inner(name),
          profiles!playlist_shares_shared_by_fkey(email)
        `)
        .eq('share_token', shareToken)
        .single();

      if (shareData) {
        setShareInfo({
          playlist_name: shareData.playlists.name,
          shared_by_email: shareData.profiles.email,
          shared_with_email: shareData.shared_with_email,
        });
        setEmail(shareData.shared_with_email);
        setMode('signup');
      }
    } catch (error) {
      console.error('Error validating share token:', error);
      setError('Failed to validate invitation');
    } finally {
      setLoadingShare(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Name is required');
          return;
        }
        if (!shareToken) {
          setError('Share token is required for signup');
          return;
        }
        await signup(email, password, name, shareToken);
      } else {
        await login(email, password);
      }
      navigate('/collaborate');
    } catch (error: unknown) {
      const authError = error as { message?: string };
      setError(authError.message || `Failed to ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingShare) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-silver">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-yellow/20 rounded-full mb-4">
            <Music2 className="w-8 h-8 text-accent-yellow" />
          </div>
          <h1 className="font-anton text-3xl text-silver mb-2">CoreTet Collaborate</h1>
          {shareInfo ? (
            <div className="space-y-2">
              <p className="font-quicksand text-silver/80">
                {shareInfo.shared_by_email} invited you to collaborate on
              </p>
              <p className="font-quicksand text-lg text-accent-yellow">
                "{shareInfo.playlist_name}"
              </p>
            </div>
          ) : (
            <p className="font-quicksand text-silver/80">
              {mode === 'login' ? 'Sign in to your collaborator account' : 'Create your collaborator account'}
            </p>
          )}
        </div>

        <div className="bg-forest-main rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block font-quicksand text-sm text-silver/80 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-silver/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-forest-light border border-forest-light rounded-lg pl-10 pr-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                    placeholder="John Doe"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-quicksand text-sm text-silver/80 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-silver/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-forest-light border border-forest-light rounded-lg pl-10 pr-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  placeholder="your@email.com"
                  required
                  disabled={!!shareInfo}
                />
              </div>
            </div>

            <div>
              <label className="block font-quicksand text-sm text-silver/80 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-silver/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-forest-light border border-forest-light rounded-lg pl-10 pr-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-accent-coral/10 border border-accent-coral/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-accent-coral mt-0.5" />
                  <p className="font-quicksand text-sm text-accent-coral">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {!shareInfo && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                }}
                className="font-quicksand text-sm text-silver/60 hover:text-silver"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-forest-light">
            <p className="font-quicksand text-xs text-silver/40 text-center">
              Collaborator accounts are separate from main user accounts and can only access shared playlists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorAuth;