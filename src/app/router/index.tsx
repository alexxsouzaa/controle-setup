import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { routeObjects } from './routes';

const router = createHashRouter([
  {
    element: <AppLayout />,
    children: routeObjects.map((route) => ({
      path: route.path,
      element: route.element,
    })),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
