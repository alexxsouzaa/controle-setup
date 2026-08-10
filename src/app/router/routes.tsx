import { lazy, Suspense, type ReactNode } from 'react';
import { Loading } from '../../components/shared/EmptyState';

const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const FluxosPage = lazy(() => import('../../features/flows/pages/FluxosPage').then((m) => ({ default: m.FluxosPage })));
const NovoSetupPage = lazy(() => import('../../features/setup-flow/pages/NovoSetupPage').then((m) => ({ default: m.NovoSetupPage })));
const ImportPage = lazy(() => import('../../features/import-export/pages/ImportPage').then((m) => ({ default: m.ImportPage })));
const MaquinasPage = lazy(() => import('../../features/machines/pages/MaquinasPage').then((m) => ({ default: m.MaquinasPage })));
const MachineDetailsPage = lazy(() => import('../../features/machines/pages/MachineDetailsPage').then((m) => ({ default: m.MachineDetailsPage })));
const NewMachinePage = lazy(() => import('../../features/machines/pages/NewMachinePage').then((m) => ({ default: m.NewMachinePage })));
const ProdutosPage = lazy(() => import('../../features/products/pages/ProdutosPage').then((m) => ({ default: m.ProdutosPage })));
const PecasPage = lazy(() => import('../../features/pieces/pages/PecasPage').then((m) => ({ default: m.PecasPage })));
const FormatosPage = lazy(() => import('../../features/formatos/pages/FormatosPage').then((m) => ({ default: m.FormatosPage })));
const FormatoDetailsPage = lazy(() => import('../../features/formatos/pages/FormatoDetailsPage').then((m) => ({ default: m.FormatoDetailsPage })));
const ExportPage = lazy(() => import('../../features/import-export/pages/ExportPage').then((m) => ({ default: m.ExportPage })));
const HistoricoPage = lazy(() => import('../../features/history/pages/HistoricoPage').then((m) => ({ default: m.HistoricoPage })));
const ConfigPage = lazy(() => import('../../features/config/pages/ConfigPage').then((m) => ({ default: m.ConfigPage })));
const UnitsPage = lazy(() => import('../../features/units/pages/UnitsPage').then((m) => ({ default: m.UnitsPage })));
const NewUnitPage = lazy(() => import('../../features/units/pages/NewUnitPage').then((m) => ({ default: m.NewUnitPage })));
const LinesPage = lazy(() => import('../../features/lines/pages/LinesPage').then((m) => ({ default: m.LinesPage })));
const NewLinePage = lazy(() => import('../../features/lines/pages/NewLinePage').then((m) => ({ default: m.NewLinePage })));

export const ALLOW_NEW_PATHS = new Set(['/dashboard', '/fluxos', '/maquinas', '/produtos', '/pecas', '/formatos']);

export const ROUTE_TITLES: Record<string, string> = {
  '/login': 'Entrar',
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
  '/unidades': 'Unidades (UO)',
  '/unidades/new': 'Nova UO',
  '/unidades/:id/edit': 'Editar UO',
  '/linhas': 'Linhas',
  '/linhas/new': 'Nova Linha',
  '/linhas/:id/edit': 'Editar Linha',
  '/exportar': 'Exportar',
  '/historico': 'Histórico',
  '/configuracoes': 'Configurações',
};

function withSuspense(element: ReactNode): ReactNode {
  return <Suspense fallback={<Loading />}>{element}</Suspense>;
}

interface RouteDef {
  path: string;
  element: ReactNode;
}

export const routeObjects: RouteDef[] = [
  { path: '/dashboard', element: withSuspense(<DashboardPage />) },
  { path: '/fluxos', element: withSuspense(<FluxosPage />) },
  { path: '/novo-fluxo', element: withSuspense(<NovoSetupPage />) },
  { path: '/importar', element: withSuspense(<ImportPage />) },
  { path: '/maquinas', element: withSuspense(<MaquinasPage />) },
  { path: '/maquinas/new', element: withSuspense(<NewMachinePage />) },
  { path: '/maquinas/:id/edit', element: withSuspense(<NewMachinePage />) },
  { path: '/maquinas/:id', element: withSuspense(<MachineDetailsPage />) },
  { path: '/produtos', element: withSuspense(<ProdutosPage />) },
  { path: '/pecas', element: withSuspense(<PecasPage />) },
  { path: '/formatos', element: withSuspense(<FormatosPage />) },
  { path: '/formatos/:id', element: withSuspense(<FormatoDetailsPage />) },
  { path: '/unidades', element: withSuspense(<UnitsPage />) },
  { path: '/unidades/new', element: withSuspense(<NewUnitPage />) },
  { path: '/unidades/:id/edit', element: withSuspense(<NewUnitPage />) },
  { path: '/linhas', element: withSuspense(<LinesPage />) },
  { path: '/linhas/new', element: withSuspense(<NewLinePage />) },
  { path: '/linhas/:id/edit', element: withSuspense(<NewLinePage />) },
  { path: '/exportar', element: withSuspense(<ExportPage />) },
  { path: '/historico', element: withSuspense(<HistoricoPage />) },
  { path: '/configuracoes', element: withSuspense(<ConfigPage />) },
  { path: '/', element: withSuspense(<DashboardPage />) },
  { path: '*', element: withSuspense(<DashboardPage />) },
];
