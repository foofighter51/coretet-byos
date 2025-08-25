import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export type ThemeName = 'forest' | 'studio-sessions' | 'midnight-jazz' | 'vintage-tape' | 'aurora' | 'natural-studio';

interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themes: Theme[] = [
  {
    name: 'forest',
    label: 'Forest Theme',
    description: 'Current theme',
    colors: {
      primary: '#1a2e26',
      secondary: '#243830',
      accent: '#e4da38'
    }
  },
  {
    name: 'studio-sessions',
    label: 'Studio Sessions',
    description: 'Warm & professional',
    colors: {
      primary: '#1C1C1E',
      secondary: '#2C2C2E',
      accent: '#FFB800'
    }
  },
  {
    name: 'midnight-jazz',
    label: 'Midnight Jazz',
    description: 'Cool & sophisticated',
    colors: {
      primary: '#0A0E27',
      secondary: '#1A1B3A',
      accent: '#00D4FF'
    }
  },
  {
    name: 'vintage-tape',
    label: 'Vintage Tape',
    description: 'Classic & accessible',
    colors: {
      primary: '#1A1A1A',
      secondary: '#2D2D2D',
      accent: '#E63946'
    }
  },
  {
    name: 'aurora',
    label: 'Aurora',
    description: 'High contrast',
    colors: {
      primary: '#000000',
      secondary: '#1A1A1A',
      accent: '#FF0080'
    }
  },
  {
    name: 'natural-studio',
    label: 'Natural Studio',
    description: 'Refined earth tones',
    colors: {
      primary: '#0D1117',
      secondary: '#1C2128',
      accent: '#FFA500'
    }
  }
];

export default function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    return (localStorage.getItem('coretet-theme') as ThemeName) || 'forest';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply theme on mount
    applyTheme(currentTheme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyTheme = (themeName: ThemeName) => {
    const root = document.documentElement;
    
    switch (themeName) {
      case 'forest':
        root.style.setProperty('--forest-dark', '#0a1612');
        root.style.setProperty('--forest-main', '#1a2e26');
        root.style.setProperty('--forest-light', '#243830');
        root.style.setProperty('--silver', '#ebeae8');
        root.style.setProperty('--accent-yellow', '#e4da38');
        root.style.setProperty('--accent-coral', '#d27556');
        break;
        
      case 'studio-sessions':
        root.style.setProperty('--forest-dark', '#1C1C1E');
        root.style.setProperty('--forest-main', '#1C1C1E');
        root.style.setProperty('--forest-light', '#2C2C2E');
        root.style.setProperty('--silver', '#F5F5F0');
        root.style.setProperty('--accent-yellow', '#FFB800');
        root.style.setProperty('--accent-coral', '#FF6B35');
        break;
        
      case 'midnight-jazz':
        root.style.setProperty('--forest-dark', '#0A0E27');
        root.style.setProperty('--forest-main', '#0A0E27');
        root.style.setProperty('--forest-light', '#1A1B3A');
        root.style.setProperty('--silver', '#E8EAED');
        root.style.setProperty('--accent-yellow', '#00D4FF');
        root.style.setProperty('--accent-coral', '#B24BF3');
        break;
        
      case 'vintage-tape':
        root.style.setProperty('--forest-dark', '#1A1A1A');
        root.style.setProperty('--forest-main', '#1A1A1A');
        root.style.setProperty('--forest-light', '#2D2D2D');
        root.style.setProperty('--silver', '#FAF9F6');
        root.style.setProperty('--accent-yellow', '#E63946');
        root.style.setProperty('--accent-coral', '#F1C40F');
        break;
        
      case 'aurora':
        root.style.setProperty('--forest-dark', '#000000');
        root.style.setProperty('--forest-main', '#000000');
        root.style.setProperty('--forest-light', '#1A1A1A');
        root.style.setProperty('--silver', '#FFFFFF');
        root.style.setProperty('--accent-yellow', '#FF0080');
        root.style.setProperty('--accent-coral', '#00D4FF');
        break;
        
      case 'natural-studio':
        root.style.setProperty('--forest-dark', '#0D1117');
        root.style.setProperty('--forest-main', '#0D1117');
        root.style.setProperty('--forest-light', '#1C2128');
        root.style.setProperty('--silver', '#F0E6D2');
        root.style.setProperty('--accent-yellow', '#FFA500');
        root.style.setProperty('--accent-coral', '#5DADE2');
        break;
    }
    
    // Save to localStorage
    localStorage.setItem('coretet-theme', themeName);
    setCurrentTheme(themeName);
  };

  const handleThemeSelect = (themeName: ThemeName) => {
    applyTheme(themeName);
    setIsOpen(false);
  };

  const activeTheme = themes.find(t => t.name === currentTheme);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-forest-light hover:bg-forest-light/80 transition-colors"
        title="Change theme"
      >
        <Palette className="w-4 h-4 text-silver" />
        <span className="text-sm font-quicksand text-silver hidden sm:inline">
          {activeTheme?.label}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-forest-dark border border-forest-light rounded-lg shadow-xl z-50">
          <div className="p-2">
            <h3 className="font-quicksand text-xs text-silver/60 uppercase tracking-wider px-3 py-2">
              Choose Theme
            </h3>
            
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleThemeSelect(theme.name)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors hover:bg-forest-light/50 ${
                  currentTheme === theme.name ? 'bg-forest-light' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-quicksand font-medium text-silver">
                        {theme.label}
                      </span>
                      {currentTheme === theme.name && (
                        <Check className="w-4 h-4 text-accent-yellow" />
                      )}
                    </div>
                    <p className="text-xs text-silver/60 mt-1">
                      {theme.description}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-3">
                    <div
                      className="w-4 h-4 rounded-full border border-silver/20"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-silver/20"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-silver/20"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t border-forest-light p-3">
            <p className="text-xs text-silver/60 text-center">
              Theme preference is saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}