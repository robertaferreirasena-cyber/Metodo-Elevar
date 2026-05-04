import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared QueryClient instance.
 * Exported so non-component code (auth hook, cache cleaners) can call
 * queryClient.clear() / removeQueries() during user transitions.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});
