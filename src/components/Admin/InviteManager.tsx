import React, { useEffect, useState } from 'react';
import { Plus, Copy, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Invite {
  id: string;
  code: string;
  email: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

const InviteManager: React.FC = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!user) return;
    
    setCreating(true);
    try {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error } = await supabase
        .from('invites')
        .insert({
          code,
          email: newInviteEmail || null,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;
      
      setNewInviteEmail('');
      await loadInvites();
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      setCreating(false);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getInviteStatus = (invite: Invite) => {
    if (invite.used_by) return 'used';
    if (isExpired(invite.expires_at)) return 'expired';
    return 'active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeInvites = invites.filter(invite => getInviteStatus(invite) === 'active');
  const usedInvites = invites.filter(invite => getInviteStatus(invite) === 'used');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-anton text-xl text-silver mb-2">Invite Management</h2>
          <p className="font-quicksand text-sm text-silver/80">
            Create and manage user invitations
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-forest-main px-4 py-2 rounded-lg">
            <span className="font-quicksand text-sm text-accent-yellow">
              {activeInvites.length} Active
            </span>
          </div>
          <div className="bg-forest-main px-4 py-2 rounded-lg">
            <span className="font-quicksand text-sm text-green-400">
              {usedInvites.length} Used
            </span>
          </div>
        </div>
      </div>

      {/* Create New Invite */}
      <div className="bg-forest-main rounded-lg p-6">
        <h3 className="font-anton text-lg text-silver mb-4">Create New Invite</h3>
        
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Email (optional)"
              value={newInviteEmail}
              onChange={(e) => setNewInviteEmail(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            />
          </div>
          
          <button
            onClick={createInvite}
            disabled={creating}
            className="bg-accent-yellow text-forest-dark px-4 py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-forest-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Invite</span>
              </>
            )}
          </button>
        </div>
        
        <p className="font-quicksand text-xs text-silver/60 mt-2">
          Invites expire after 7 days. Email is optional but helps track usage.
        </p>
      </div>

      {/* Invites List */}
      <div className="bg-forest-main rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-forest-light">
              <tr>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-light">
              {invites.map((invite) => {
                const status = getInviteStatus(invite);
                return (
                  <tr key={invite.id} className="hover:bg-forest-light/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="font-mono text-sm text-silver bg-forest-dark px-2 py-1 rounded">
                          {invite.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(invite.code)}
                          className="text-silver/60 hover:text-accent-yellow transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {invite.email ? (
                          <>
                            <Mail className="w-4 h-4 text-silver/60 mr-2" />
                            <span className="font-quicksand text-sm text-silver">
                              {invite.email}
                            </span>
                          </>
                        ) : (
                          <span className="font-quicksand text-sm text-silver/60">
                            No email
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {status === 'used' && (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                            <span className="font-quicksand text-sm text-green-400">Used</span>
                          </>
                        )}
                        {status === 'expired' && (
                          <>
                            <XCircle className="w-4 h-4 text-accent-coral mr-2" />
                            <span className="font-quicksand text-sm text-accent-coral">Expired</span>
                          </>
                        )}
                        {status === 'active' && (
                          <>
                            <Clock className="w-4 h-4 text-accent-yellow mr-2" />
                            <span className="font-quicksand text-sm text-accent-yellow">Active</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-quicksand text-sm text-silver/80">
                        {formatDate(invite.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-quicksand text-sm text-silver/80">
                        {formatDate(invite.expires_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status === 'active' && (
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}?invite=${invite.code}`)}
                          className="bg-accent-yellow/20 text-accent-yellow px-3 py-1 rounded-lg font-quicksand text-xs hover:bg-accent-yellow/30 transition-colors"
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InviteManager;