import React, { useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  initialInviteCode?: string;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn, initialInviteCode = '' }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, inviteCode);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-silver" />
        </div>
        <h2 className="font-anton text-xl text-silver mb-4">Account Created!</h2>
        <p className="font-quicksand text-silver/80 mb-6">
          Your account has been created successfully. You can now sign in.
        </p>
        <button
          onClick={onSwitchToSignIn}
          className="bg-accent-yellow text-forest-dark px-6 py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-anton text-xl text-silver mb-6">Sign Up</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            placeholder="Enter your invite code"
            required
          />
        </div>

        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            placeholder="Create a password"
            required
          />
        </div>

        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            placeholder="Confirm your password"
            required
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-accent-coral text-sm">
            <AlertCircle className="w-4 h-4" />
            <span className="font-quicksand">{error}</span>
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
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="font-quicksand text-sm text-silver/80">
          Already have an account?{' '}
          <button
            onClick={onSwitchToSignIn}
            className="text-accent-yellow hover:text-accent-yellow/90 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;