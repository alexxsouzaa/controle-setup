import { useState, useEffect, useCallback } from 'react';

export function useHashRoute(): [string, (path: string) => void] {
  const [hash, setHash] = useState<string>(() => window.location.hash.slice(1) || '/dashboard');
  useEffect(() => {
    const handler = () => setHash(window.location.hash.slice(1) || '/dashboard');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = useCallback((path: string) => { window.location.hash = path; }, []);
  return [hash, navigate];
}
