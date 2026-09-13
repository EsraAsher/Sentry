import React, { useEffect } from 'react';
import { ToastItem } from '../types';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      onDismiss(oldest.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-[340px] max-w-[calc(100vw-32px)] pointer-events-none select-none"
    >
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />;
        let borderColor = 'border-outline-variant/30';

        if (toast.type === 'critical') {
          icon = <AlertCircle className="w-4 h-4 text-error shrink-0" />;
          borderColor = 'border-error/40';
        } else if (toast.type === 'warn') {
          icon = <AlertTriangle className="w-4 h-4 text-tertiary shrink-0" />;
          borderColor = 'border-tertiary/40';
        } else if (toast.type === 'synced') {
          icon = <Info className="w-4 h-4 text-primary shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto w-full rounded-md p-3 shadow-lg bg-surface-container-high/95 backdrop-blur-sm border ${borderColor} transition-all duration-200 flex items-start gap-2.5`}
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium text-[13px] text-on-surface truncate">
                  {toast.title}
                </span>
                <span className="font-mono text-[10px] text-outline shrink-0">
                  {toast.timestamp}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant line-clamp-2 mt-0.5">
                {toast.codeTarget && (
                  <span className="font-mono text-[11px] text-primary mr-1">
                    {toast.codeTarget}:
                  </span>
                )}
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Close notification"
              className="text-outline hover:text-on-surface p-0.5 rounded transition-colors -mr-1 -mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};

