import { useEffect, useState } from 'react';

export function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${colors[type]}`}>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (message, type = 'error') => setToast({ message, type });
  const hide = () => setToast(null);

  return { toast, show, hide };
}
