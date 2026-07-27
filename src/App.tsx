import { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './pages/Dashboard';
import { FluxosPage } from './pages/Fluxos';
import { NovoSetupPage } from './pages/NovoSetup';
import { ImportPage } from './pages/ImportPage';
import { MaquinasPage } from './pages/Maquinas';
import { ProdutosPage } from './pages/Produtos';
import { PecasPage } from './pages/Pecas';
import { FormatosPage } from './pages/Formatos';
import { ExportPage } from './pages/ExportPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { ConfigPage } from './pages/ConfigPage';

const ALLOW_NEW_PATHS = new Set(['/dashboard', '/fluxos', '/maquinas', '/produtos', '/pecas', '/formatos']);

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/fluxos': 'Fluxos de Setup',
  '/novo-fluxo': 'Novo Fluxo',
  '/importar': 'Importar',
  '/maquinas': 'Máquinas',
  '/produtos': 'Produtos',
  '/pecas': 'Peças',
  '/formatos': 'Formatos',
  '/exportar': 'Exportar',
  '/historico': 'Histórico',
  '/configuracoes': 'Configurações',
};

function AppLayout() {
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

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/fluxos" element={<FluxosPage />} />
              <Route path="/novo-fluxo" element={<NovoSetupPage />} />
              <Route path="/importar" element={<ImportPage />} />
              <Route path="/maquinas" element={<MaquinasPage />} />
              <Route path="/produtos" element={<ProdutosPage />} />
              <Route path="/pecas" element={<PecasPage />} />
              <Route path="/formatos" element={<FormatosPage />} />
              <Route path="/exportar" element={<ExportPage />} />
              <Route path="/historico" element={<HistoricoPage />} />
              <Route path="/configuracoes" element={<ConfigPage />} />
              <Route path="/" element={<DashboardPage />} />
              <Route path="*" element={<DashboardPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
