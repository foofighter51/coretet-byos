import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    // TODO: Implement sign out logic
    console.log('Sign out clicked');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-forest-light/50 hover:bg-forest-light/70 transition-colors rounded-lg px-3 py-2 border border-forest-light/30"
      >
        <svg className="w-4 h-4 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-silver font-quicksand text-sm">Account</span>
        <svg 
          className={`w-3 h-3 text-silver transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-forest-main border border-forest-light/30 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-forest-light/30">
            <div className="text-silver font-quicksand text-sm">ericexley@gmail.com</div>
            <div className="text-silver/60 font-quicksand text-xs mt-1">Storage: 360.9 MB / 1.0 GB</div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => handleMenuClick('/profile')}
              className="w-full flex items-center space-x-3 px-4 py-2 text-silver hover:bg-forest-light/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-quicksand text-sm">Profile Settings</span>
            </button>

            <button
              onClick={() => handleMenuClick('/change-password')}
              className="w-full flex items-center space-x-3 px-4 py-2 text-silver hover:bg-forest-light/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="font-quicksand text-sm">Change Password</span>
            </button>

            <button
              onClick={() => handleMenuClick('/deleted-tracks')}
              className="w-full flex items-center space-x-3 px-4 py-2 text-silver hover:bg-forest-light/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="font-quicksand text-sm">Deleted Tracks</span>
            </button>

            <div className="border-t border-forest-light/30 my-2"></div>

            <button
              onClick={() => handleMenuClick('/tutorial')}
              className="w-full flex items-center space-x-3 px-4 py-2 text-silver hover:bg-forest-light/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-quicksand text-sm">View Tutorial</span>
            </button>

            {/* Admin Access - Only show for admin users */}
            <button
              onClick={() => handleMenuClick('/admin')}
              className="w-full flex items-center space-x-3 px-4 py-2 text-orange-400 hover:bg-forest-light/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-quicksand text-sm">Admin Dashboard</span>
            </button>

            <div className="border-t border-forest-light/30 my-2"></div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-forest-light/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-quicksand text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}