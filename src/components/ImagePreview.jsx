export function ImagePreview({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-[var(--overlay)]" onClick={onClose} onKeyDown={e => e.key === 'Escape' && onClose()} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none" onClick={onClose}>
        <div className="pointer-events-auto max-w-2xl max-h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
            <span className="text-sm font-medium truncate">{alt || 'Foto'}</span>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 rounded hover:bg-[var(--bg)] text-[var(--fg-secondary)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <img src={src} alt={alt || 'Foto'} className="w-full h-auto max-h-[70vh] object-contain" />
        </div>
      </div>
    </>
  );
}
