import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password reset instructions have been sent to your email. Please check your inbox.'
      });
      setEmail('');
    } catch (error: unknown) {
      const resetError = error as { message?: string };
      setMessage({
        type: 'error',
        text: resetError.message || 'Failed to send reset email. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-silver/80 hover:text-silver mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-quicksand text-sm">Back to Sign In</span>
      </button>

      <h2 className="font-anton text-xl text-silver mb-2">Reset Password</h2>
      <p className="font-quicksand text-sm text-silver/60 mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            placeholder="Enter your email"
            required
            disabled={loading}
          />
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
          className="w-full bg-accent-yellow text-forest-dark py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-forest-dark border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Send Reset Instructions</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;