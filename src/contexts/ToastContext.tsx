import { createContext, useState, useCallback, useRef, ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: string;
}

interface ToastContextValue {
  toast: (message: string, type?: string, duration?: number) => number;
  removeToast: (id: number) => void;
}

let toastId = 0;

export const ToastContext = createContext<ToastContextValue>({ toast: () => 0, removeToast: () => {} });

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: number) => {
    setToasts((prev: ToastItem[]) => prev.filter((t: ToastItem) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message: string, type: string = 'success', duration: number = 3000) => {
    const id = ++toastId;
    setToasts((prev: ToastItem[]) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const iconMap: Record<string, string> = { success: '\u2713', error: '\u2715', warning: '!' };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t: ToastItem) => (
          <div key={t.id} role="alert" onClick={() => removeToast(t.id)}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-[6px] text-[13px] font-medium shadow-md cursor-pointer transition-all duration-200"
            style={{
              background: t.type === 'error' ? 'var(--danger)' : t.type === 'warning' ? 'var(--warning)' : 'var(--fg)',
              color: t.type === 'error' || t.type === 'warning' ? 'var(--bg)' : 'var(--bg)',
              animation: 'toastSlideIn 0.2s ease-out',
            }}
          >
            <span className="text-[14px] shrink-0">{iconMap[t.type] || '\u2139'}</span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
