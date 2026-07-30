import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { FluxosPage } from '../../features/flows/pages/FluxosPage';
import { NovoSetupPage } from '../../features/setup-flow/pages/NovoSetupPage';
import { ImportPage } from '../../features/import-export/pages/ImportPage';
import { MaquinasPage } from '../../features/machines/pages/MaquinasPage';
import { MachineDetailsPage } from '../../features/machines/pages/MachineDetailsPage';
import { NewMachinePage } from '../../features/machines/pages/NewMachinePage';
import { ProdutosPage } from '../../features/products/pages/ProdutosPage';
import { PecasPage } from '../../features/pieces/pages/PecasPage';
import { FormatosPage } from '../../features/formatos/pages/FormatosPage';
import { FormatoDetailsPage } from '../../features/formatos/pages/FormatoDetailsPage';
import { ExportPage } from '../../features/import-export/pages/ExportPage';
import { HistoricoPage } from '../../features/history/pages/HistoricoPage';
import { ConfigPage } from '../../features/config/pages/ConfigPage';

export const ALLOW_NEW_PATHS = new Set(['/dashboard', '/fluxos', '/maquinas', '/produtos', '/pecas', '/formatos']);

export const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/fluxos': 'Fluxos de Setup',
  '/novo-fluxo': 'Novo Fluxo',
  '/importar': 'Importar',
  '/maquinas': 'Máquinas',
  '/maquinas/new': 'Nova Máquina',
  '/maquinas/:id': 'Detalhes',
  '/maquinas/:id/edit': 'Editar Máquina',
  '/produtos': 'Produtos',
  '/pecas': 'Peças',
  '/formatos': 'Formatos',
  '/formatos/:id': 'Detalhes do Formato',
  '/exportar': 'Exportar',
  '/historico': 'Histórico',
  '/configuracoes': 'Configurações',
};

interface RouteDef {
  path: string;
  element: React.ReactNode;
}

export const routeObjects: RouteDef[] = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/fluxos', element: <FluxosPage /> },
  { path: '/novo-fluxo', element: <NovoSetupPage /> },
  { path: '/importar', element: <ImportPage /> },
  { path: '/maquinas', element: <MaquinasPage /> },
  { path: '/maquinas/new', element: <NewMachinePage /> },
  { path: '/maquinas/:id/edit', element: <NewMachinePage /> },
  { path: '/maquinas/:id', element: <MachineDetailsPage /> },
  { path: '/produtos', element: <ProdutosPage /> },
  { path: '/pecas', element: <PecasPage /> },
  { path: '/formatos', element: <FormatosPage /> },
  { path: '/formatos/:id', element: <FormatoDetailsPage /> },
  { path: '/exportar', element: <ExportPage /> },
  { path: '/historico', element: <HistoricoPage /> },
  { path: '/configuracoes', element: <ConfigPage /> },
  { path: '/', element: <DashboardPage /> },
  { path: '*', element: <DashboardPage /> },
];
