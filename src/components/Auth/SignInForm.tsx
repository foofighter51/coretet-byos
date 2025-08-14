import React, { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToSignUp, onForgotPassword }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <h2 className="font-anton text-xl text-silver mb-6">Sign In</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-accent-yellow hover:text-accent-yellow/90 text-sm font-quicksand mt-1 transition-colors"
          >
            Forgot password?
          </button>
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
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="font-quicksand text-sm text-silver/80">
          Need an account?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="text-accent-yellow hover:text-accent-yellow/90 transition-colors"
          >
            Sign up with invite code
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;