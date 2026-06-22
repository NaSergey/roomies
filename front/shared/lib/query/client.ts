import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 мин — не рефетчим без причины
      retry: 1,
      refetchOnWindowFocus: false, // TG WebApp не имеет реального focus
    },
  },
});
