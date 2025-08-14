import React, { useState } from 'react';
import { ArrowLeft, Users, Activity, Mail } from 'lucide-react';
import UserManagement from './UserManagement';
import InviteManager from './InviteManager';
import SystemStats from './SystemStats';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'invites'>('stats');

  const tabs = [
    { id: 'stats' as const, name: 'System Stats', icon: Activity },
    { id: 'users' as const, name: 'User Management', icon: Users },
    { id: 'invites' as const, name: 'Invite Manager', icon: Mail },
  ];

  return (
    <div className="fixed inset-0 bg-forest-dark flex flex-col">
      <header className="bg-forest-dark border-b border-forest-light flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="flex items-center space-x-2 text-silver/80 hover:text-silver transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-quicksand text-sm">Back to App</span>
              </button>
              <div className="h-6 w-px bg-forest-light" />
              <h1 className="font-anton text-2xl text-silver">Admin Dashboard</h1>
            </div>
            
            <div className="bg-forest-main px-3 py-1 rounded-full">
              <span className="font-quicksand text-sm text-accent-coral">Admin Access</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-forest-main rounded-lg p-1 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md font-quicksand text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-forest-light text-accent-yellow'
                      : 'text-silver/80 hover:text-silver hover:bg-forest-light/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-6 pb-6">
            {activeTab === 'stats' && <SystemStats />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'invites' && <InviteManager />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;