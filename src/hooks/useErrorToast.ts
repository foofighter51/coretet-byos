import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

export function useErrorToast() {
  const { showToast } = useToast();

  useEffect(() => {
    const handleError = (event: CustomEvent) => {
      const { message, type } = event.detail;
      showToast(message, type);
    };

    window.addEventListener('app-error' as any, handleError);

    return () => {
      window.removeEventListener('app-error' as any, handleError);
    };
  }, [showToast]);
}