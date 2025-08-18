import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'invites'>('stats');
  const navigate = useNavigate();

  const tabs = [
    { id: 'stats' as const, label: 'System Stats', icon: 'chart' },
    { id: 'users' as const, label: 'User Management', icon: 'users' },
    { id: 'invites' as const, label: 'Invite Manager', icon: 'mail' },
  ];

  const getTabIcon = (iconType: string) => {
    switch (iconType) {
      case 'chart':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        );
      case 'users':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        );
      case 'mail':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="v2-layout bg-forest-dark h-screen flex flex-col">
      {/* Header */}
      <header className="bg-forest-main border-b border-forest-light flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-silver/60 hover:text-silver transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-quicksand text-sm">Back to App</span>
            </button>
            <h1 className="text-2xl font-anton text-white">Admin Dashboard</h1>
          </div>
          <div className="text-orange-400 font-quicksand text-sm">Admin Access</div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-forest-main/50 border-b border-forest-light flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-yellow text-accent-yellow'
                    : 'border-transparent text-silver/60 hover:text-silver'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {getTabIcon(tab.icon)}
                </svg>
                <span className="font-quicksand text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'stats' && <SystemStatsTab />}
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'invites' && <InviteManagerTab />}
        </div>
      </div>
    </div>
  );
}

function SystemStatsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-anton text-white mb-6">System Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-forest-main border border-forest-light/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-silver/60 text-sm font-quicksand">Total Users</p>
              <p className="text-2xl font-anton text-white">1,247</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Works */}
        <div className="bg-forest-main border border-forest-light/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-silver/60 text-sm font-quicksand">Total Works</p>
              <p className="text-2xl font-anton text-white">8,542</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-forest-main border border-forest-light/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-silver/60 text-sm font-quicksand">Storage Used</p>
              <p className="text-2xl font-anton text-white">2.4 TB</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-forest-main border border-forest-light/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-silver/60 text-sm font-quicksand">Active Sessions</p>
              <p className="text-2xl font-anton text-white">342</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-forest-main border border-forest-light/30 rounded-lg p-6">
        <h3 className="text-lg font-anton text-white mb-4">Recent System Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 minutes ago', action: 'New user registration', user: 'john@example.com' },
            { time: '15 minutes ago', action: 'Work uploaded', user: 'sarah@example.com' },
            { time: '1 hour ago', action: 'Storage integration connected', user: 'mike@example.com' },
            { time: '2 hours ago', action: 'Admin login', user: 'admin@coretet.com' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-forest-light/20 last:border-b-0">
              <div>
                <p className="text-silver text-sm font-quicksand">{activity.action}</p>
                <p className="text-silver/60 text-xs font-quicksand">{activity.user}</p>
              </div>
              <span className="text-silver/40 text-xs font-quicksand">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserManagementTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-anton text-white">User Management</h2>
        <div className="text-accent-yellow font-quicksand text-sm">1 Total Users</div>
      </div>
      <p className="text-silver/70 font-quicksand">Manage user accounts and permissions</p>

      {/* User Table */}
      <div className="bg-forest-main border border-forest-light/30 rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-forest-light/30 bg-forest-light/20">
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">User</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Role</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Storage</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Tracks</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Joined</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Actions</div>
        </div>
        
        <div className="grid grid-cols-6 gap-4 p-4 items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-forest-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-silver font-quicksand text-sm">ericexley@gmail.com</span>
          </div>
          <div>
            <span className="inline-flex px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-quicksand">admin</span>
          </div>
          <div className="text-silver font-quicksand text-sm">360.9 MB</div>
          <div className="text-silver font-quicksand text-sm">100</div>
          <div className="text-silver font-quicksand text-sm">7/26/2025</div>
          <div>
            <button className="text-red-400 hover:text-red-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteManagerTab() {
  const [newInviteEmail, setNewInviteEmail] = useState('');

  const invites = [
    { code: 'T2P0PBZ', email: 'testuser@example.com', status: 'Active', created: '8/18/2025', expires: '9/25/2025' },
    { code: 'B9006X4', email: 'jonathan@gmail.com', status: 'Expired', created: '8/8/2025', expires: '8/19/2025' },
    { code: 'EE043B0', email: null, status: 'Expired', created: '7/28/2025', expires: '8/4/2025' },
    { code: '28PK3DL', email: null, status: 'Expired', created: '7/28/2025', expires: '8/4/2025' },
    { code: 'RRW3ZE3', email: 'bernard@example.gmail.com', status: 'Expired', created: '7/28/2025', expires: '8/4/2025' },
    { code: '9AP8A1C', email: 'test.andrew.carr@gmail.com', status: 'Expired', created: '7/28/2025', expires: '8/4/2025' },
    { code: 'MCR00G8', email: 'daniel@mendelsohn-staff.com', status: 'Expired', created: '7/28/2025', expires: '8/4/2025' },
  ];

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating invite for:', newInviteEmail);
    setNewInviteEmail('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-anton text-white">Invite Management</h2>
      <p className="text-silver/70 font-quicksand">Create and manage user invitations</p>

      {/* Create New Invite */}
      <div className="bg-forest-main border border-forest-light/30 rounded-lg p-6">
        <h3 className="text-lg font-anton text-white mb-4">Create New Invite</h3>
        <form onSubmit={handleCreateInvite} className="flex space-x-4">
          <input
            type="email"
            value={newInviteEmail}
            onChange={(e) => setNewInviteEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 bg-forest-light/50 text-silver placeholder-silver/50 border border-forest-light/30 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-yellow/50 focus:bg-forest-light/70 transition-colors font-quicksand text-sm"
          />
          <button
            type="submit"
            className="bg-accent-yellow text-forest-dark px-6 py-2 rounded-lg font-quicksand font-semibold hover:bg-accent-yellow/90 transition-colors"
          >
            Create Invite
          </button>
        </form>
        <p className="text-silver/60 font-quicksand text-xs mt-2">
          Invites expire after 7 days. Email is optional but link track usage.
        </p>
      </div>

      {/* Invite Statistics */}
      <div className="flex space-x-4">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="text-green-400 font-anton text-xl">1</div>
          <div className="text-green-400/70 font-quicksand text-xs">Active</div>
        </div>
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-red-400 font-anton text-xl">6</div>
          <div className="text-red-400/70 font-quicksand text-xs">Used</div>
        </div>
      </div>

      {/* Invite Table */}
      <div className="bg-forest-main border border-forest-light/30 rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-forest-light/30 bg-forest-light/20">
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Code</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Email</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Status</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Created</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Expires</div>
          <div className="text-silver/70 font-quicksand text-xs uppercase tracking-wide">Actions</div>
        </div>
        
        {invites.map((invite, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 p-4 items-center border-b border-forest-light/10 last:border-b-0">
            <div className="flex items-center space-x-2">
              <button className="text-silver/60 hover:text-silver transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <span className="text-silver font-quicksand text-sm font-mono">{invite.code}</span>
            </div>
            <div className="text-silver font-quicksand text-sm">
              {invite.email || <span className="text-silver/40">No email</span>}
            </div>
            <div>
              <span className={`inline-flex px-2 py-1 rounded text-xs font-quicksand ${
                invite.status === 'Active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {invite.status}
              </span>
            </div>
            <div className="text-silver font-quicksand text-sm">{invite.created}</div>
            <div className="text-silver font-quicksand text-sm">{invite.expires}</div>
            <div>
              <button className="text-silver/60 hover:text-silver transition-colors mr-2" title="Copy Link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}