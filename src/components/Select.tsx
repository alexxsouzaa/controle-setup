interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function Select({ children, className = '', ...props }: SelectProps) {
  return <select className={`shad-select ${className}`} {...props}>{children}</select>;
}
