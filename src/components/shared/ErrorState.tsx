import { Button } from '../Button';
import { Icon } from '../Icon';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Ocorreu um erro ao carregar os dados.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--danger-muted)] flex items-center justify-center mb-4">
        <Icon name="alert" size={24} />
      </div>
      <p className="text-sm text-[var(--fg-secondary)] mb-4">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  );
}
