import { useState, useEffect, useCallback } from 'react';

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1) || '/dashboard');
  useEffect(() => {
    const handler = () => setHash(window.location.hash.slice(1) || '/dashboard');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = useCallback((path) => { window.location.hash = path; }, []);
  return [hash, navigate];
}
