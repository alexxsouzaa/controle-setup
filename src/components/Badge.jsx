const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  secondary: 'badge-secondary',
};

export function Badge({ variant = 'secondary', children }) {
  return <span className={`shad-badge ${variants[variant] || variants.secondary}`}>{children}</span>;
}
