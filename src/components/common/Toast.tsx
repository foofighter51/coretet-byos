import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-accent-yellow" />,
    error: <AlertCircle className="w-5 h-5 text-accent-coral" />,
    info: <Info className="w-5 h-5 text-silver" />
  };

  const colors = {
    success: 'border-accent-yellow/50',
    error: 'border-accent-coral/50',
    info: 'border-silver/50'
  };

  return (
    <div className={`animate-slide-in-bottom fixed bottom-6 right-6 z-50 bg-forest-main border-2 ${colors[type]} rounded-lg shadow-xl p-4 pr-12 max-w-sm`}>
      <div className="flex items-start space-x-3">
        {icons[type]}
        <p className="font-quicksand text-sm text-silver">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-silver/60 hover:text-silver transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;