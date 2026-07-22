import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';

export function PlaceholderPage({ title }) {
  return (
    <div className="p-6 flex-1 flex items-center justify-center">
      <EmptyState icon={<Icon name="settings" size={24} />} title={title} desc="Página em desenvolvimento. Esta funcionalidade estará disponível em breve." />
    </div>
  );
}
