import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidToken(true);
      } else {
        setMessage({
          type: 'error',
          text: 'Invalid or expired reset link. Please request a new password reset.'
        });
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Password reset successfully! Redirecting to sign in...' 
      });
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: unknown) {
      const resetError = error as { message?: string };
      setMessage({ 
        type: 'error', 
        text: resetError.message || 'Failed to reset password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-forest-dark" />
          </div>
          <h1 className="font-anton text-3xl text-silver">CoreTet</h1>
        </div>

        {/* Reset Form */}
        <div className="bg-forest-main rounded-xl p-8">
          <h2 className="font-anton text-xl text-silver mb-6">Reset Your Password</h2>
          
          {isValidToken ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-quicksand text-sm text-silver/80 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 pr-10 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-silver/60 hover:text-silver"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-quicksand text-sm text-silver/80 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 pr-10 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
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
                <div className={`flex items-start space-x-2 p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-900/20 text-green-400 border border-green-800' 
                    : 'bg-red-900/20 text-red-400 border border-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="font-quicksand text-sm">{message.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent-yellow text-forest-dark py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-forest-dark border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          ) : (
            <div>
              {message && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-900/20 text-red-400 border border-red-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="font-quicksand text-sm">{message.text}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/auth')}
                className="w-full mt-4 bg-forest-light text-silver py-2 rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;