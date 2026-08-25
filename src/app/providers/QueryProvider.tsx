import { lazy, Suspense } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toAppError, reportError } from "@/lib/errors";

/** Don't burn retries on failures that repeat deterministically. */
const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= MAX_RETRIES) return false;
  return toAppError(error).isRetryable;
}

/**
 * Refetch-on-focus is off deliberately: the connect wizard holds unsaved state
 * across several screens, and refetching under it while the user tabs away to
 * copy an API key would swap the list out from under them.
 *
 * Both caches report centrally, so a failure is never silent even when the
 * component that triggered it chooses not to render anything.
 */
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportError(error, { queryKey: String(query.queryKey) }),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) =>
      reportError(error, { mutationKey: String(mutation.options.mutationKey ?? "anonymous") }),
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 60_000,
      retry: shouldRetry,
    },
    mutations: {
      // A mutation may have side effects, so only replay it when the request
      // provably never landed.
      retry: (failureCount, error) => {
        const kind = toAppError(error).kind;
        return failureCount < 1 && (kind === "network" || kind === "offline");
      },
    },
  },
});

const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : null;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {Devtools && (
        <Suspense>
          <Devtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
