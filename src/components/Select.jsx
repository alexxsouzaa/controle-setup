export function Select({ children, className = '', ...props }) {
  return <select className={`shad-select ${className}`} {...props}>{children}</select>;
}
