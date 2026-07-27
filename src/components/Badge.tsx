interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  children: React.ReactNode;
}

const variants: Record<string, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  secondary: 'badge-secondary',
};

export function Badge({ variant = 'secondary', children }: BadgeProps) {
  return <span className={`shad-badge ${variants[variant] || variants.secondary}`}>{children}</span>;
}
