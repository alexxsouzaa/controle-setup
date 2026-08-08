import { useEffect, useRef } from 'react';

export function useDialogAccessibility(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialog) {
      dialog.focus();
      const closeBtn = dialog.querySelector<HTMLButtonElement>('[aria-label="Fechar"]');
      if (closeBtn) closeBtn.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (prevFocus) prevFocus.focus();
    };
  }, [open, onClose]);

  return ref;
}
