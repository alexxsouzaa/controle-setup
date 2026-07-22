export function Button({ variant = 'primary', size, children, disabled, className = '', type = 'button', ...props }) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`shad-btn shad-btn-${variant} ${sizes[size] || ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
