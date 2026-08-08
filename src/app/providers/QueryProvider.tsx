import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.';
          toast(message, 'error');
        },
      },
    },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
