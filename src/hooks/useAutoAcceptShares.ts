import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useAutoAcceptShares = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const acceptPendingShares = async () => {
      try {
        // Call the auto-accept function
        const { error } = await supabase
          .rpc('auto_accept_playlist_shares');

        if (error) {
          // Error auto-accepting shares
        } else {
          // Auto-accepted pending playlist shares
        }
      } catch (error) {
        // Failed to auto-accept shares
      }
    };

    // Run on mount (when user logs in)
    acceptPendingShares();
  }, [user?.id]);
};