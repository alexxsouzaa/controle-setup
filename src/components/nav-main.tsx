import { useNavigate } from 'react-router-dom'
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

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
  pathname: string;
}

export function NavMain({ items, pathname }: NavMainProps) {
  const navigate = useNavigate();

  return (
    <>
      {items.map((item) => (
        <SidebarGroup key={item.title}>
          <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
          <SidebarMenu>
            {item.items.map((subItem) => (
              <SidebarMenuItem key={subItem.title}>
                <SidebarMenuButton
                  isActive={pathname === subItem.url}
                  onClick={() => navigate(subItem.url)}
                  tooltip={subItem.title}>
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
