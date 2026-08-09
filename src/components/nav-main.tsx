import { Link, useLocation } from 'react-router-dom'
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

interface NavSubItem {
  title: string;
  url: string;
  icon: React.ReactNode;
}

interface NavItem {
  title: string;
  items: NavSubItem[];
  isActive?: boolean;
}

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar() as { isMobile: boolean; setOpenMobile: (open: boolean) => void }

  const isPathActive = (url: string) =>
    location.pathname === url || location.pathname.startsWith(url + '/')

  return (
    <>
      {items.map((item) => (
        <SidebarGroup key={item.title}>
          <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
          <SidebarMenu>
            {item.items.map((subItem) => (
              <SidebarMenuItem key={subItem.title}>
                <SidebarMenuButton
                  isActive={isPathActive(subItem.url)}
                  tooltip={subItem.title}
                  render={
                    <Link
                      to={subItem.url}
                      onClick={() => { if (isMobile) setOpenMobile(false) }}
                    />
                  }>
                  {subItem.icon}
                  <span>{subItem.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
