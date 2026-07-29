// @ts-nocheck
import { Outlet } from 'react-router-dom';
import { TooltipProvider } from '../components/ui/tooltip';
import { SidebarProvider } from '../components/ui/sidebar';
import { AppSidebar } from '../components/app-sidebar';
import { Topbar } from '../components/Topbar';

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-0">
          <Topbar />
          <div className="flex-1 min-h-0 overflow-y-auto" aria-label="Conteúdo principal">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
