import { createContext, useState, useCallback, useRef } from 'react';

let toastId = 0;

export const ToastContext = createContext({ toast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} role="alert"
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded border text-sm font-medium border-l-[3px] ${t.type === 'success' ? 'bg-[var(--surface)] border-[var(--success)] text-[var(--success)] border-l-[var(--success)]' : t.type === 'error' ? 'bg-[var(--surface)] border-[var(--danger)] text-[var(--danger)] border-l-[var(--danger)]' : t.type === 'warning' ? 'bg-[var(--surface)] border-[var(--warning)] text-[var(--warning)] border-l-[var(--warning)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] border-l-[var(--accent)]'}`}
            style={{ minWidth: 280, maxWidth: 420, animation: 'toastIn 0.25s ease-out' }}
          >
            <span className="text-lg shrink-0">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '!' : 'ℹ'}
            </span>
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => removeToast(t.id)} className="text-current opacity-50 hover:opacity-100 shrink-0 text-lg leading-none">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
