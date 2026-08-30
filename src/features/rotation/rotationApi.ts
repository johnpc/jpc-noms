/**
 * Server state for the user's saved-favorite restaurants ("the rotation").
 * Rotation is owner-auth (per-user), so all calls use `userPool` — a signed-in
 * session is required (guests are prompted to sign in before saving).
 * Writes are optimistic: the ['rotation'] cache updates at press time and
 * rolls back on error — an invalidate-refetch here held isPending until the
 * refetch finished, graying the buttons for seconds after every tap.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';

const AUTH = { authMode: 'userPool' } as const;

export interface RotationEntry {
  id: string;
  googlePlaceId: string;
}

/** The signed-in user's rotation rows. Gated on `enabled` so it never fetches
 * (and caches an empty list) before the Cognito session exists — owner-auth
 * reads return empty without a userPool session. */
export function useRotation(enabled = true) {
  return useQuery({
    queryKey: ['rotation'],
    enabled,
    queryFn: async (): Promise<RotationEntry[]> => {
      const { data } = await dataClient.models.Rotation.list(AUTH);
      return (data ?? []).map((r) => ({ id: r.id, googlePlaceId: r.googlePlaceId }));
    },
  });
}

/** Add a place to the rotation. Optimistically inserts a temp row (the real id
 * arrives with the create response and replaces it) so "In rotation ✓" flips
 * instantly. */
export function useAddToRotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (googlePlaceId: string) => {
      const { data } = await dataClient.models.Rotation.create({ googlePlaceId }, AUTH);
      return data ? { id: data.id, googlePlaceId: data.googlePlaceId } : null;
    },
    onMutate: async (googlePlaceId) => {
      await qc.cancelQueries({ queryKey: ['rotation'] });
      const prev = qc.getQueryData<RotationEntry[]>(['rotation']);
      const temp: RotationEntry = { id: `optimistic-${googlePlaceId}`, googlePlaceId };
      qc.setQueryData<RotationEntry[]>(['rotation'], (list) => [...(list ?? []), temp]);
      return { prev, tempId: temp.id };
    },
    onSuccess: (created, _v, ctx) => {
      if (!created) return;
      qc.setQueryData<RotationEntry[]>(['rotation'], (list) =>
        (list ?? []).map((r) => (r.id === ctx?.tempId ? created : r)),
      );
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['rotation'], ctx.prev);
    },
  });
}

/** Remove a rotation row by id. Optimistically drops the row. */
export function useRemoveFromRotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await dataClient.models.Rotation.delete({ id }, AUTH);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['rotation'] });
      const prev = qc.getQueryData<RotationEntry[]>(['rotation']);
      qc.setQueryData<RotationEntry[]>(['rotation'], (list) =>
        (list ?? []).filter((r) => r.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['rotation'], ctx.prev);
    },
  });
}
