// @ts-nocheck
import * as React from "react"
import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { LayoutDashboardIcon, BoxIcon, Settings2Icon } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Operação",
      icon: <LayoutDashboardIcon />,
      items: [
        { title: "Dashboard", url: "/dashboard" },
        { title: "Novo Fluxo", url: "/novo-fluxo" },
        { title: "Fluxos de Setup", url: "/fluxos" },
      ],
      isActive: true,
    },
    {
      title: "Catálogo",
      icon: <BoxIcon />,
      items: [
        { title: "Máquinas", url: "/maquinas" },
        { title: "Produtos", url: "/produtos" },
        { title: "Peças", url: "/pecas" },
        { title: "Formatos", url: "/formatos" },
      ],
    },
    {
      title: "Sistema",
      icon: <Settings2Icon />,
      items: [
        { title: "Importar", url: "/importar" },
        { title: "Exportar", url: "/exportar" },
        { title: "Histórico", url: "/historico" },
        { title: "Configurações", url: "/configuracoes" },
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
