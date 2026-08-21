import React from 'react';
import { useData } from '../../context/DataContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useData();

  if (toasts.length === 0) return null;

  return (
    <div 
      id="toast-container" 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-orange-400 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/30 bg-zinc-900/95 text-emerald-300 shadow-emerald-950/20',
          error: 'border-rose-500/30 bg-zinc-900/95 text-rose-300 shadow-rose-950/20',
          warning: 'border-amber-500/30 bg-zinc-900/95 text-amber-300 shadow-amber-950/20',
          info: 'border-orange-500/30 bg-zinc-900/95 text-orange-300 shadow-orange-950/20',
        };

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight text-white">{toast.title}</p>
              {toast.message && (
                <p className="text-xs mt-1 text-zinc-400 leading-relaxed break-words">{toast.message}</p>
              )}
            </div>
            <button
              id={`btn-close-toast-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded-lg -mr-1 -mt-1 cursor-pointer"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
