import { QueryClient, MutationCache } from '@tanstack/react-query';
import { showError, errorMessage } from './toast';

/**
 * App-wide react-query client. Server state (Amplify data) lives here.
 * A MutationCache onError surfaces ANY failed write (nom/rotation/pairing) as a
 * toast so a failure is never silent — the user knows and can retry.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  mutationCache: new MutationCache({
    onError: (err) => {
      void showError(errorMessage(err, "That didn't go through — try again."));
    },
  }),
});
