/**
 * Shared optimistic-mutation shape for the ['noms'] cache. The cache is
 * updated AT PRESS TIME (onMutate) so the UI reflects the action instantly —
 * no waiting on the network write, and definitely no waiting on a full
 * invalidate-refetch (paging every nom held isPending for seconds and grayed
 * the whole screen). A failed write rolls back and the global MutationCache
 * toast surfaces it. Deliberately NO invalidate-on-success: an immediate
 * refetch can MISS the just-written row (DynamoDB is eventually consistent)
 * and stomp the optimistic state — the 8s poll and the live subscription
 * reconcile the cache instead.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Nom } from './types';

export function useNomListMutation<V>(
  mutationFn: (v: V) => Promise<unknown>,
  apply: (list: Nom[] | undefined, v: V) => Nom[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (v: V) => {
      // Cancel in-flight refetches so a stale response can't overwrite the
      // optimistic list right after we set it.
      await qc.cancelQueries({ queryKey: ['noms'] });
      const prev = qc.getQueryData<Nom[]>(['noms']);
      qc.setQueryData<Nom[]>(['noms'], (list) => apply(list, v));
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['noms'], ctx.prev);
    },
  });
}
