import * as React from "react"
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { SetFlowLogo } from "@/components/SetFlowLogo"
import { SetFlowMark } from "@/components/SetFlowMark"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { LayoutDashboardIcon, WrenchIcon, FileIcon, UploadIcon, DownloadIcon, ClockIcon, Settings2Icon, BoxIcon, Grid3X3Icon, PuzzleIcon, ShapesIcon, Building2Icon, GitForkIcon } from "lucide-react"
import { APP_VERSION } from "@/version"

const data = {
  navMain: [
    {
      title: "Operação",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
        { title: "Novo Fluxo", url: "/novo-fluxo", icon: <WrenchIcon /> },
        { title: "Fluxos de Setup", url: "/fluxos", icon: <FileIcon /> },
      ],
    },
    {
      title: "Catálogo",
      items: [
        { title: "Máquinas", url: "/maquinas", icon: <BoxIcon /> },
        { title: "Produtos", url: "/produtos", icon: <Grid3X3Icon /> },
        { title: "Peças", url: "/pecas", icon: <PuzzleIcon /> },
        { title: "Formatos", url: "/formatos", icon: <ShapesIcon /> },
      ],
    },
    {
      title: "Organização",
      items: [
        { title: "Unidades (UO)", url: "/unidades", icon: <Building2Icon /> },
        { title: "Linhas", url: "/linhas", icon: <GitForkIcon /> },
      ],
    },
    {
      title: "Sistema",
      items: [
        { title: "Importar", url: "/importar", icon: <UploadIcon /> },
        { title: "Exportar", url: "/exportar", icon: <DownloadIcon /> },
        { title: "Histórico", url: "/historico", icon: <ClockIcon /> },
        { title: "Configurações", url: "/configuracoes", icon: <Settings2Icon /> },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useAppStore(s => s.currentUser)
  const authUser = useAuthStore(s => s.user)
  const user = { name: currentUser, email: authUser?.email || "", avatar: "" }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-[var(--border)]">
        <div className="group-data-[collapsible=icon]:hidden flex h-9 items-center justify-center gap-3">
          <SetFlowLogo className="h-[0.7875rem] w-auto" />
          <span className="text-xs font-medium text-[var(--muted-foreground)]">v{APP_VERSION}</span>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex h-9 items-center justify-center">
          <span className="flex aspect-square size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <SetFlowMark className="h-3.5 w-auto" />
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
