// @ts-nocheck
import { Outlet } from 'react-router-dom';
import { TooltipProvider } from '../components/ui/tooltip';
import { SidebarProvider } from '../components/ui/sidebar';
import { ScrollArea } from '../components/ui/scroll-area';
import { AppSidebar } from '../components/app-sidebar';
import { Topbar } from '../components/Topbar';

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-0">
          <Topbar />
          <ScrollArea className="flex-1 min-h-0">
            <Outlet />
          </ScrollArea>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
