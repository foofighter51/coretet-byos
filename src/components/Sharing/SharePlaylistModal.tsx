import React, { useState, useEffect } from 'react';
import { X, Send, Users, Mail, Check, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ShareError {
  message?: string;
  [key: string]: unknown;
}

interface SharePlaylistModalProps {
  playlistId: string;
  playlistName: string;
  onClose: () => void;
}

interface PlaylistShare {
  id: string;
  shared_with_email: string;
  status: 'pending' | 'active' | 'revoked';
  accepted_at?: string;
  can_edit: boolean;
  invited_at?: string;
}

const SharePlaylistModal: React.FC<SharePlaylistModalProps> = ({ playlistId, playlistName, onClose }) => {
  const { user, profile } = useAuth();
  const [emails, setEmails] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingShares, setExistingShares] = useState<PlaylistShare[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);

  useEffect(() => {
    loadExistingShares();
  }, [playlistId]);

  const loadExistingShares = async () => {
    try {
      const { data, error } = await supabase
        .from('playlist_shares')
        .select(`
          id,
          shared_with_email,
          status,
          accepted_at,
          can_edit,
          invited_at
        `)
        .eq('playlist_id', playlistId)
        .neq('status', 'revoked')  // Don't show revoked shares
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setExistingShares(data || []);
    } catch (error) {
      // Error loading shares
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!emails.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      // Parse single email
      const emailInput = emails.trim();
      if (!emailInput) {
        setError('Please enter an email address');
        return;
      }
      const emailList = [emailInput];

      // Validate emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput)) {
        setError('Please enter a valid email address');
        return;
      }

      // Check for existing shares (including revoked) before creating
      const { data: existingAllShares } = await supabase
        .from('playlist_shares')
        .select('shared_with_email, status')
        .eq('playlist_id', playlistId)
        .in('shared_with_email', emailList.map(e => e.toLowerCase()));

      // Filter out emails that have non-revoked shares
      const blockedEmails = existingAllShares
        ?.filter(share => share.status !== 'revoked')
        .map(share => share.shared_with_email) || [];

      // Update revoked shares if they exist
      const revokedEmails = existingAllShares
        ?.filter(share => share.status === 'revoked')
        .map(share => share.shared_with_email) || [];

      if (blockedEmails.length > 0) {
        setError(`The following users already have access: ${blockedEmails.join(', ')}`);
        return;
      }

      // For revoked shares, update them instead of creating new ones
      if (revokedEmails.length > 0) {
        const { error: updateError } = await supabase
          .from('playlist_shares')
          .update({ 
            status: 'pending', 
            invited_at: new Date().toISOString()
          })
          .eq('playlist_id', playlistId)
          .in('shared_with_email', revokedEmails);

        if (updateError) throw updateError;
      }

      // Create new shares for emails that don't exist
      const newEmails = emailList.filter(email => 
        !existingAllShares?.some(share => 
          share.shared_with_email === email.toLowerCase()
        )
      );

      let createdShares = [];
      if (newEmails.length > 0) {
        const sharesToCreate = newEmails.map(email => ({
          playlist_id: playlistId,
          shared_by: user?.id,
          shared_with_email: email.toLowerCase(),
          status: 'pending',
          can_edit: false
        }));

        const { data, error: shareError } = await supabase
          .from('playlist_shares')
          .insert(sharesToCreate)
          .select();

        if (shareError) throw shareError;
        createdShares = data || [];
      }

      // Combine updated and created shares for email sending
      const totalShares = [...revokedEmails, ...newEmails];
      if (totalShares.length > 0) {
        // Send email notifications for each share
        let emailsSent = 0;
        for (const email of totalShares) {
          try {
            // For revoked shares, we need to get the share id
            let shareId = '';
            if (revokedEmails.includes(email)) {
              const { data: shareData } = await supabase
                .from('playlist_shares')
                .select('id')
                .eq('playlist_id', playlistId)
                .eq('shared_with_email', email.toLowerCase())
                .single();
              shareId = shareData?.id || '';
            } else {
              // For new shares, find from createdShares
              const newShare = createdShares.find(s => s.shared_with_email === email.toLowerCase());
              shareId = newShare?.id || '';
            }

            // Sending email notification
            
            const { data: emailData, error: emailError } = await supabase.functions.invoke('send-playlist-invite', {
              body: {
                playlistId: playlistId,
                playlistName: playlistName,
                sharedByEmail: profile?.email || 'A CoreTet user',
                sharedWithEmail: email.toLowerCase(),
                shareId: shareId
              }
            });
            
            // Email function response received
            
            if (!emailError && emailData?.success) {
              emailsSent++;
              // Email sent successfully
            } else {
              // Error sending invite email
            }
          } catch (emailErr: unknown) {
            const shareEmailError = emailErr as ShareError;
            // Failed to send email
          }
        }
        
        if (emailsSent === totalShares.length) {
          setSuccess(`Successfully invited ${emailInput} to collaborate`);
        } else {
          setSuccess(`Invitation sent to ${emailInput}. Email notification may be pending.`);
        }
        
        setEmails('');
        // Reload shares
        await loadExistingShares();
      }
    } catch (error: unknown) {
      const shareError = error as ShareError;
      // Share error occurred
      setError(shareError.message || 'Failed to share playlist');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_shares')
        .update({ status: 'revoked' })
        .eq('id', shareId);

      if (error) throw error;
      
      loadExistingShares();
    } catch (error) {
      // Error revoking share
      setError('Failed to revoke access');
    }
  };

  const toggleEditPermission = async (shareId: string, currentCanEdit: boolean) => {
    try {
      const { error } = await supabase
        .from('playlist_shares')
        .update({ can_edit: !currentCanEdit })
        .eq('id', shareId);

      if (error) throw error;
      
      loadExistingShares();
    } catch (error) {
      // Error updating permissions
      setError('Failed to update permissions');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-forest-main rounded-xl p-6 max-w-2xl w-full mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-accent-yellow" />
            <h3 className="font-anton text-lg text-silver">Share "{playlistName}"</h3>
          </div>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Invite a collaborator by email
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                disabled={isSharing}
              />
              <button
                onClick={handleShare}
                disabled={isSharing || !emails.trim()}
                className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSharing ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
            <p className="mt-1 font-quicksand text-xs text-silver/60">
              Enter one email address to share with
            </p>
          </div>

          {error && (
            <div className="p-3 bg-accent-coral/10 border border-accent-coral/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-accent-coral mt-0.5" />
                <p className="font-quicksand text-sm text-accent-coral whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-accent-green/10 border border-accent-green/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-accent-green mt-0.5" />
                <p className="font-quicksand text-sm text-accent-green">{success}</p>
              </div>
            </div>
          )}
        </div>

        {/* Existing shares */}
        <div className="border-t border-forest-light pt-4">
          <h4 className="font-quicksand text-sm text-silver/80 mb-3">Current collaborators</h4>
          
          {loadingShares ? (
            <p className="font-quicksand text-sm text-silver/60">Loading...</p>
          ) : existingShares.length === 0 ? (
            <p className="font-quicksand text-sm text-silver/60">No collaborators yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {existingShares.map((share) => (
                <div
                  key={share.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    share.status === 'revoked' 
                      ? 'bg-forest-light/20 opacity-60' 
                      : 'bg-forest-light/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-silver/60" />
                    <div className="flex-1">
                      <p className="font-quicksand text-sm text-silver">
                        {share.shared_with_email}
                      </p>
                      <p className="font-quicksand text-xs text-silver/60">
                        {share.status === 'pending' ? 'Invitation pending' : 
                         share.status === 'active' ? 'Active' : 'Revoked'}
                        {share.can_edit && share.status === 'active' && (
                          <span className="text-accent-yellow"> • Can edit</span>
                        )}
                        {share.invited_at && (
                          <span className="text-silver/40"> • Invited {new Date(share.invited_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {share.status === 'active' && (
                      <button
                        onClick={() => toggleEditPermission(share.id, share.can_edit)}
                        className="px-2 py-1 text-xs font-quicksand rounded border transition-colors"
                        style={{
                          borderColor: share.can_edit ? '#FFD700' : 'rgba(192, 192, 192, 0.3)',
                          color: share.can_edit ? '#FFD700' : 'rgba(192, 192, 192, 0.6)',
                          backgroundColor: share.can_edit ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
                        }}
                      >
                        {share.can_edit ? 'Can Edit' : 'View Only'}
                      </button>
                    )}
                    {share.status !== 'revoked' && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        className="px-2 py-1 text-xs text-accent-coral hover:text-accent-coral/80 font-quicksand border border-accent-coral/30 rounded hover:bg-accent-coral/10 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-forest-light/50 rounded-lg">
          <p className="font-quicksand text-xs text-silver/60">
            <strong>View Only:</strong> Can listen to tracks, rate them, and see everyone's ratings.<br/>
            <strong>Can Edit:</strong> Same as view only, plus can add/remove tracks and modify playlist details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharePlaylistModal;