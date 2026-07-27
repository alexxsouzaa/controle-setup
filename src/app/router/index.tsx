import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { routeObjects } from './routes';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {routeObjects.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  );
}
