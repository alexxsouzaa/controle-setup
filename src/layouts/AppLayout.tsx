// @ts-nocheck
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TooltipProvider } from '../components/ui/tooltip';
import { SidebarProvider } from '../components/ui/sidebar';
import { AppSidebar } from '../components/app-sidebar';
import { Topbar } from '../components/Topbar';
import { ROUTE_TITLES, ALLOW_NEW_PATHS } from '../app/router/routes';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const title = ROUTE_TITLES[path] || 'Dashboard';
  const showNew = ALLOW_NEW_PATHS.has(path);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <Topbar title={title} onNew={showNew ? () => navigate('/novo-fluxo') : undefined} />
          <div className="flex-1 flex flex-col overflow-y-auto p-6" aria-label="Conteúdo principal">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
