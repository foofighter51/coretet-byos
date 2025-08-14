import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Music, List, Share2, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MobileLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const navItems = [
    { path: '/mobile/now', icon: Music, label: 'Now Playing' },
    { path: '/mobile/my-lists', icon: List, label: 'My Lists' },
    { path: '/mobile/shared', icon: Share2, label: 'Shared' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="h-screen flex flex-col bg-forest-dark text-silver font-quicksand overscroll-behavior-none">
      {/* Fixed Header with Safe Area */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-forest-main border-b border-forest-light pt-safe-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-screen-sm mx-auto">
          <h1 className="font-anton text-2xl text-accent-yellow">CORETET</h1>
          <button
            onClick={handleSignOut}
            className="p-2 text-silver hover:text-accent-yellow transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area with proper spacing */}
      <main className="flex-1 overflow-hidden" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}>
        <div className="max-w-screen-sm mx-auto h-full">
          <Outlet />
        </div>
      </main>

      {/* Fixed Bottom Tab Bar with Safe Area */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-forest-main border-t border-forest-light pb-safe">
        <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || 
                           (path === '/mobile/now' && location.pathname === '/mobile');
            
            return (
              <NavLink
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center py-3 px-3 flex-1 h-full transition-all duration-200 min-w-[44px] active:scale-95 ${
                  isActive 
                    ? 'text-accent-yellow' 
                    : 'text-silver opacity-60 hover:opacity-100'
                }`}
              >
                <Icon className="w-6 h-6 mb-1 transition-transform duration-200" />
                <span className="text-xs transition-all duration-200">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;