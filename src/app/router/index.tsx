import { lazy, Suspense } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { RequireAuth } from '../../components/RequireAuth';
import { Loading } from '../../components/shared/EmptyState';
import { routeObjects } from './routes';

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));

const router = createHashRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: routeObjects.map((route) => ({
      path: route.path,
      element: route.element,
    })),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
