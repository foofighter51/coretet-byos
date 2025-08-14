import React, { useEffect, useState } from 'react';
import { Users, HardDrive, Music, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTracks: number;
  totalStorage: number;
  avgStoragePerUser: number;
  tracksThisWeek: number;
}

const SystemStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get user stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('storage_used, is_active, created_at');

      // Get track stats - file_size doesn't exist in tracks table
      // We'll approximate using storage_used from profiles
      const { data: tracks } = await supabase
        .from('tracks')
        .select('created_at');

      if (profiles && tracks) {
        const totalUsers = profiles.length;
        const activeUsers = profiles.filter(p => p.is_active).length;
        const totalTracks = tracks.length;
        // Use storage_used from profiles instead of file_size from tracks
        const totalStorage = profiles.reduce((sum, profile) => sum + (profile.storage_used || 0), 0);
        const avgStoragePerUser = totalUsers > 0 ? totalStorage / totalUsers : 0;
        
        // Tracks uploaded in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const tracksThisWeek = tracks.filter(
          track => new Date(track.created_at) > weekAgo
        ).length;

        setStats({
          totalUsers,
          activeUsers,
          totalTracks,
          totalStorage,
          avgStoragePerUser,
          tracksThisWeek,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="font-quicksand text-silver/80">Failed to load statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active`,
      icon: Users,
      color: 'text-accent-yellow',
    },
    {
      title: 'Total Tracks',
      value: stats.totalTracks,
      subtitle: `${stats.tracksThisWeek} this week`,
      icon: Music,
      color: 'text-accent-coral',
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats.totalStorage),
      subtitle: `${formatBytes(stats.avgStoragePerUser)} avg/user`,
      icon: HardDrive,
      color: 'text-accent-yellow',
    },
    {
      title: 'Weekly Growth',
      value: `+${stats.tracksThisWeek}`,
      subtitle: 'tracks uploaded',
      icon: TrendingUp,
      color: 'text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-anton text-xl text-silver mb-2">System Overview</h2>
        <p className="font-quicksand text-sm text-silver/80">
          Real-time statistics for CoreTet platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-forest-main rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-forest-light flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              
              <div>
                <h3 className="font-quicksand text-sm text-silver/80 mb-1">
                  {card.title}
                </h3>
                <p className="font-anton text-2xl text-silver mb-1">
                  {card.value}
                </p>
                <p className="font-quicksand text-xs text-silver/60">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Storage Usage Chart */}
      <div className="bg-forest-main rounded-lg p-6">
        <h3 className="font-anton text-lg text-silver mb-4">Storage Distribution</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-quicksand text-silver/80">Used Storage</span>
            <span className="font-quicksand text-silver">{formatBytes(stats.totalStorage)}</span>
          </div>
          <div className="w-full bg-forest-dark rounded-full h-2">
            <div 
              className="bg-accent-yellow h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((stats.totalStorage / (100 * 1024 * 1024 * 1024)) * 100, 100)}%` 
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-quicksand text-silver/60">0 GB</span>
            <span className="font-quicksand text-silver/60">100 GB (Max)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStats;