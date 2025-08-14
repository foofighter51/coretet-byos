import React, { useState } from 'react';
import { Shield, User, Mail, Key } from 'lucide-react';
import { createAdminUser, createFirstInvite } from '../../utils/setupAdmin';

interface AdminSetupProps {
  onComplete: () => void;
}

const AdminSetup: React.FC<AdminSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'admin' | 'invite' | 'complete'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleDebugDatabase = async () => {
    try {
      const { debugDatabaseConnection, testUserCreation } = await import('../../utils/debugDatabase');
      // Running database diagnostics
      await debugDatabaseConnection();
      await testUserCreation();
    } catch (error) {
      // Debug failed
    }
  };
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createAdminUser(adminEmail, adminPassword);
    
    if (result.success) {
      setStep('invite');
    } else {
      setError(result.error || 'Failed to create admin user');
    }
    
    setLoading(false);
  };

  const handleCreateInvite = async () => {
    setLoading(true);
    setError(null);

    const result = await createFirstInvite();
    
    if (result.success) {
      setInviteCode(result.code || '');
      setStep('complete');
    } else {
      setError(result.error || 'Failed to create invite');
    }
    
    setLoading(false);
  };

  if (step === 'complete') {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-silver" />
        </div>
        
        <div>
          <h2 className="font-anton text-xl text-silver mb-2">Setup Complete!</h2>
          <p className="font-quicksand text-silver/80 mb-4">
            Your admin account has been created and the first invite code is ready.
          </p>
          
          <div className="bg-forest-light rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Key className="w-4 h-4 text-accent-yellow" />
              <span className="font-quicksand text-sm text-accent-yellow">First Invite Code</span>
            </div>
            <code className="font-mono text-lg text-silver bg-forest-dark px-3 py-2 rounded block">
              {inviteCode}
            </code>
            <p className="font-quicksand text-xs text-silver/60 mt-2">
              Use this code to invite the first users to your platform
            </p>
          </div>
        </div>
        
        <button
          onClick={onComplete}
          className="bg-accent-yellow text-forest-dark px-6 py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
        >
          Continue to App
        </button>
      </div>
    );
  }

  if (step === 'invite') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-forest-dark" />
          </div>
          <h2 className="font-anton text-xl text-silver mb-2">Create First Invite</h2>
          <p className="font-quicksand text-silver/80">
            Let's create the first invite code so you can invite users to join.
          </p>
        </div>

        {error && (
          <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-4">
            <p className="font-quicksand text-sm text-accent-coral">{error}</p>
          </div>
        )}

        <button
          onClick={handleCreateInvite}
          disabled={loading}
          className="w-full bg-accent-yellow text-forest-dark py-3 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-forest-dark border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>Create Invite Code</span>
            </>
          )}
        </button>
      </div>
    );
      <div className="mt-4">
        <button
          onClick={handleDebugDatabase}
          className="w-full bg-forest-light text-silver py-2 rounded-lg font-quicksand text-sm hover:bg-forest-light/80 transition-colors"
        >
          🔍 Debug Database Connection
        </button>
        
        <div className="mt-2 text-center">
          <p className="font-quicksand text-xs text-silver/60">
            If you're getting database errors, you may need to set up your Supabase database first.
          </p>
        </div>
      </div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-accent-yellow rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-forest-dark" />
        </div>
        <h2 className="font-anton text-xl text-silver mb-2">Create Admin Account</h2>
        <p className="font-quicksand text-silver/80">
          Let's set up your admin account to manage the platform.
        </p>
      </div>

      {error && (
        <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-4">
          <p className="font-quicksand text-sm text-accent-coral">{error}</p>
        </div>
      )}

      <form onSubmit={handleCreateAdmin} className="space-y-4">
        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Admin Email
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            placeholder="admin@yourcompany.com"
            required
          />
        </div>

        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Admin Password
          </label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            placeholder="Create a secure password"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-yellow text-forest-dark py-3 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-forest-dark border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Create Admin Account</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleDebugDatabase}
          className="w-full bg-forest-light text-silver py-2 rounded-lg font-quicksand text-sm hover:bg-forest-light/80 transition-colors"
        >
          🔍 Debug Database Connection
        </button>
        
        <div className="mt-2 text-center">
          <p className="font-quicksand text-xs text-silver/60">
            If you're getting database errors, you may need to set up your Supabase database first.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;