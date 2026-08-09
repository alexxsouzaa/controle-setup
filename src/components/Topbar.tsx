import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Icon } from '@/components/Icon';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ROUTE_TITLES } from '@/app/router/routes';
import { useMachines } from '@/queries/useMachines';

export function Topbar() {
  const { theme, toggle } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { data: machines = [] } = useMachines();

  const machineNames = new Map((machines as any[]).map((m: any) => [m.id, m.name]));

  const parts = path === '/' ? ['dashboard'] : path.split('/').filter(Boolean);

  return (
    <header className="h-[52px] border-b border-[var(--border)] bg-[var(--bg)] flex items-center px-5 gap-1.5 sticky top-0 z-10">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
      <Breadcrumb className="flex items-center mr-auto">
        <BreadcrumbList className="text-[11px] gap-0.5 sm:gap-1">
          <BreadcrumbItem className="gap-0.5">
            <BreadcrumbLink asChild>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors leading-none">
                SetFlow
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {parts.map((segment, i) => {
            const fullPath = '/' + parts.slice(0, i + 1).join('/');
            const label = ROUTE_TITLES[fullPath] || machineNames.get(segment) || (segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));
            const isLast = i === parts.length - 1;

            return (
              <BreadcrumbItem key={fullPath} className="gap-0.5">
                <BreadcrumbSeparator />
                {isLast ? (
                  <BreadcrumbPage className="text-[11px] font-semibold text-[var(--fg)]">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button
                      type="button"
                      onClick={() => navigate(fullPath)}
                      className="text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors leading-none">
                      {label}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-[6px] text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] transition-colors"
          aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>
    </header>
  );
}
