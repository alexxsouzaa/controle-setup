import { Icon } from '../Icon';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none">
        <Icon name="search" size={14} />
      </span>
      <input className="shad-input pl-8 py-1.5 text-[12px]" {...props} />
    </div>
  );
}
