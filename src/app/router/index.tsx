import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { RequireAuth } from '../../components/RequireAuth';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { routeObjects } from './routes';

const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
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
