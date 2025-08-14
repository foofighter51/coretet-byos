import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface SidebarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  position: { top: number; left: number };
  children: React.ReactNode;
}

const SidebarPopup: React.FC<SidebarPopupProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  icon,
  position,
  children 
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={popupRef}
      className="fixed z-50 bg-forest-main border border-forest-light rounded-lg shadow-2xl animate-fade-in"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        minWidth: '280px',
        maxWidth: '320px',
        maxHeight: '400px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-forest-light">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="font-anton text-sm text-silver">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-forest-light rounded transition-colors"
        >
          <X className="w-4 h-4 text-silver/60 hover:text-silver" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
        {children}
      </div>
    </div>
  );
};

export default SidebarPopup;