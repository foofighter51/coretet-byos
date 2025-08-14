import React, { useEffect, useState } from 'react';
import { User, Shield, Ban, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  storage_used: number;
  storage_limit: number;
  is_active: boolean;
  created_at: string;
  role?: 'user' | 'admin';
  track_count?: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get profiles (user_roles table was removed)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        // Get track counts for each user
        const usersWithCounts = await Promise.all(
          profiles.map(async (profile) => {
            const { count } = await supabase
              .from('tracks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            // Determine role based on email (since user_roles table was removed)
            const role = profile.email?.toLowerCase() === 'ericexley@gmail.com' ? 'admin' : 'user';
            
            return {
              ...profile,
              role,
              track_count: count || 0,
            };
          })
        );

        setUsers(usersWithCounts);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-anton text-xl text-silver mb-2">User Management</h2>
          <p className="font-quicksand text-sm text-silver/80">
            Manage user accounts and permissions
          </p>
        </div>
        
        <div className="bg-forest-main px-4 py-2 rounded-lg">
          <span className="font-quicksand text-sm text-accent-yellow">
            {users.length} Total Users
          </span>
        </div>
      </div>

      <div className="bg-forest-main rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-forest-light">
              <tr>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Storage
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Tracks
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-quicksand text-xs font-medium text-silver/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-light">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-forest-light/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-forest-light rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-accent-yellow" />
                      </div>
                      <div className="ml-3">
                        <p className="font-quicksand text-sm text-silver">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.role === 'admin' && (
                        <Shield className="w-4 h-4 text-accent-coral mr-2" />
                      )}
                      <span className={`font-quicksand text-sm ${
                        user.role === 'admin' ? 'text-accent-coral' : 'text-silver/80'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-quicksand text-sm text-silver">
                        {formatBytes(user.storage_used)}
                      </p>
                      <div className="w-20 bg-forest-dark rounded-full h-1 mt-1">
                        <div 
                          className="bg-accent-yellow h-1 rounded-full"
                          style={{ 
                            width: `${(user.storage_used / user.storage_limit) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-quicksand text-sm text-silver/80">
                      {user.track_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-quicksand text-sm text-silver/80">
                      {formatDate(user.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.is_active ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-accent-coral mr-2" />
                      )}
                      <span className={`font-quicksand text-sm ${
                        user.is_active ? 'text-green-400' : 'text-accent-coral'
                      }`}>
                        {user.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-quicksand text-xs transition-colors ${
                        user.is_active
                          ? 'bg-accent-coral/100/20 text-accent-coral hover:bg-accent-coral/100/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <Ban className="w-3 h-3" />
                          <span>Disable</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Enable</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;