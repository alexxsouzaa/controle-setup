import { ThemeProvider } from './contexts/ThemeContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { ToastProvider } from './contexts/ToastContext';
import { useHashRoute } from './hooks/useHashRoute';
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

function renderRoutes(navigate) {
  return {
    '/dashboard': { title: 'Dashboard', page: <DashboardPage navigate={navigate} /> },
    '/fluxos': { title: 'Fluxos de Setup', page: <FluxosPage navigate={navigate} /> },
    '/novo-setup': { title: 'Novo Fluxo', page: <NovoSetupPage navigate={navigate} />, allowNew: true },
    '/importar': { title: 'Importar', page: <ImportPage navigate={navigate} /> },
    '/maquinas': { title: 'Máquinas', page: <MaquinasPage navigate={navigate} /> },
    '/produtos': { title: 'Produtos', page: <ProdutosPage /> },
    '/pecas': { title: 'Peças', page: <PecasPage /> },
    '/formatos': { title: 'Formatos', page: <FormatosPage navigate={navigate} /> },
    '/exportar': { title: 'Exportar', page: <ExportPage /> },
    '/historico': { title: 'Histórico', page: <HistoricoPage /> },
    '/opcoes': { title: 'Opções', page: <ConfigPage /> },
  };
}

export default function App() {
  const [hash, navigate] = useHashRoute();
  const routes = renderRoutes(navigate);
  const route = routes[hash] || routes['/dashboard'];

  return (
    <ThemeProvider>
      <AppDataProvider>
        <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar active={hash} navigate={navigate} />
          <div className="flex-1 ml-60 flex flex-col">
            <Topbar title={route.title} onNew={route.allowNew ? () => navigate('/novo-setup') : null} />
            <main className="flex-1 flex flex-col" aria-label="Conteúdo principal">{route.page}</main>
          </div>
        </div>
        </ToastProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
