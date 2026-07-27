// @ts-nocheck
import { Outlet } from 'react-router-dom';
import { TooltipProvider } from '../components/ui/tooltip';
import { SidebarProvider } from '../components/ui/sidebar';
import { AppSidebar } from '../components/app-sidebar';
import { Topbar } from '../components/Topbar';
import { ScrollArea } from '../components/ui/scroll-area';

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <Topbar />
          <ScrollArea className="flex-1" aria-label="Conteúdo principal">
            <Outlet />
          </ScrollArea>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
