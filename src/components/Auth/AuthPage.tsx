import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import AdminSetup from './AdminSetup';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'setup' | 'forgot'>('signin');
  const [inviteCode, setInviteCode] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    // Check for invite code in URL
    const searchParams = new URLSearchParams(location.search);
    const invite = searchParams.get('invite');
    if (invite) {
      setInviteCode(invite);
      setMode('signup'); // Switch to signup mode if invite code is present
    }
  }, [location]);

  const handleSetupComplete = () => {
    setMode('signin');
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

        {/* Auth Forms */}
        <div className="bg-forest-main rounded-xl p-8">
          {mode === 'setup' ? (
            <AdminSetup onComplete={handleSetupComplete} />
          ) : mode === 'signin' ? (
            <SignInForm 
              onSwitchToSignUp={() => setMode('signup')}
              onForgotPassword={() => setMode('forgot')}
            />
          ) : mode === 'forgot' ? (
            <ForgotPasswordForm onBack={() => setMode('signin')} />
          ) : (
            <SignUpForm 
              onSwitchToSignIn={() => setMode('signin')} 
              initialInviteCode={inviteCode}
            />
          )}
        </div>

        {/* Beta Notice */}
        {mode !== 'setup' && (
          <div className="text-center">
            <div className="bg-forest-main px-4 py-2 rounded-full inline-block">
              <span className="font-quicksand text-sm text-accent-yellow">Beta Version</span>
            </div>
          </div>
        )}
        
        {/* Setup Mode Navigation */}
        {mode !== 'signin' && mode !== 'signup' && (
          <div className="bg-forest-main px-4 py-2 rounded-full inline-block">
            <button
              onClick={() => setMode('signin')}
              className="font-quicksand text-sm text-silver/60 hover:text-accent-yellow transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;