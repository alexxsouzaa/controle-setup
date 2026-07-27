// @ts-nocheck
import * as React from "react"
import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { LayoutDashboardIcon, WrenchIcon, FileIcon, UploadIcon, DownloadIcon, ClockIcon, Settings2Icon, BoxIcon, Grid3X3Icon, PuzzleIcon, ShapesIcon } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Operação",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
        { title: "Novo Fluxo", url: "/novo-fluxo", icon: <WrenchIcon /> },
        { title: "Fluxos de Setup", url: "/fluxos", icon: <FileIcon /> },
      ],
      isActive: true,
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
      title: "Sistema",
      items: [
        { title: "Importar", url: "/importar", icon: <UploadIcon /> },
        { title: "Exportar", url: "/exportar", icon: <DownloadIcon /> },
        { title: "Histórico", url: "/historico", icon: <ClockIcon /> },
        { title: "Configurações", url: "/configuracoes", icon: <Settings2Icon /> },
      ],
    },
  ],
  teams: [
    { name: "CS Setup", logo: <BoxIcon />, plan: "Setup Industrial" },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const currentUser = useAppStore(s => s.currentUser)
  const user = { name: currentUser, email: "", avatar: "" }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} pathname={location.pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
