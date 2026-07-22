export function Card({ children, className = '' }) {
  return <div className={`shad-card ${className}`}>{children}</div>;
}
