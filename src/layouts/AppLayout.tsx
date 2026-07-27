import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { ROUTE_TITLES, ALLOW_NEW_PATHS } from '../app/router/routes';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const path = location.pathname;
  const title = ROUTE_TITLES[path] || 'Dashboard';
  const showNew = ALLOW_NEW_PATHS.has(path);

  return (
    <div className="flex min-h-screen">
      <div className={`sidebar-overlay ${menuOpen ? 'open' : ''}`} onClick={closeMenu} />
      <Sidebar className={menuOpen ? 'mobile-open' : ''} />
      <div className="flex-1 ml-60 flex flex-col">
        <Topbar title={title} onNew={showNew ? () => navigate('/novo-fluxo') : undefined} onMenuToggle={toggleMenu} />
        <main className="flex-1 flex flex-col overflow-y-auto min-h-0" aria-label="Conteúdo principal">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
