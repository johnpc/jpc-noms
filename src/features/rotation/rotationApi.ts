/**
 * Server state for the user's saved-favorite restaurants ("the rotation").
 * Rotation is owner-auth (per-user), so all calls use `userPool` — a signed-in
 * session is required (guests are prompted to sign in before saving).
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

/** Add a place to the rotation, then refresh the list. */
export function useAddToRotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (googlePlaceId: string) => {
      await dataClient.models.Rotation.create({ googlePlaceId }, AUTH);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rotation'] }),
  });
}

/** Remove a rotation row by id, then refresh the list. */
export function useRemoveFromRotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await dataClient.models.Rotation.delete({ id }, AUTH);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rotation'] }),
  });
}
