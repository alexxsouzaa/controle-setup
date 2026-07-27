import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ThemeContextValue {
  theme: string;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggle: () => {} });

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('cs-theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cs-theme', theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme((t: string) => t === 'dark' ? 'light' : 'dark'), []);
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
