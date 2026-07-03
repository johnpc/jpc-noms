import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { usePairing as usePairingQuery, useCreatePairing, useAcceptPairing } from './pairingApi';
import { pairingView } from './pairing';

/**
 * Pairing-page logic: resolves the caller's pairing into a view (none /
 * pending-sent / pending-received / active) and exposes invite + accept
 * actions. Gated on a signed-in session.
 */
export function usePairingFlow() {
  const { status, email } = useAuth();
  const signedIn = status === 'authenticated';
  const query = usePairingQuery(signedIn);
  const create = useCreatePairing();
  const accept = useAcceptPairing();
  const [inviteEmail, setInviteEmail] = useState('');

  const view = pairingView(query.data ?? null, email ?? '');

  return {
    signedIn,
    loading: query.isLoading,
    view,
    inviteEmail,
    setInviteEmail,
    invite: () => inviteEmail.trim() && create.mutate(inviteEmail.trim()),
    inviting: create.isPending,
    accept: (pairingId: string) => accept.mutate(pairingId),
    accepting: accept.isPending,
  };
}
