import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import {
  usePairing as usePairingQuery,
  useCreatePairing,
  useAcceptPairing,
  useUnpair,
} from './pairingApi';
import { usePairingRealtime } from './usePairingRealtime';
import { pairingView } from './pairing';

/**
 * Pairing-page logic: resolves the caller's pairing into a view (none /
 * pending-sent / pending-received / active) and exposes invite + accept
 * actions. Kept live via the Pairing subscription so both apps reflect a
 * scan-to-pair instantly. Gated on a signed-in session.
 */
export function usePairingFlow() {
  const { status, email } = useAuth();
  const signedIn = status === 'authenticated';
  const query = usePairingQuery(signedIn, email ?? '');
  const create = useCreatePairing();
  const accept = useAcceptPairing();
  const unpair = useUnpair();
  usePairingRealtime(signedIn);
  const [inviteEmail, setInviteEmail] = useState('');

  const view = pairingView(query.data ?? null, email ?? '');

  return {
    signedIn,
    loading: query.isLoading,
    view,
    inviteEmail,
    setInviteEmail,
    invite: () =>
      inviteEmail.trim() &&
      create.mutate({ inviteeEmail: inviteEmail.trim(), callerEmail: email ?? '' }),
    inviting: create.isPending,
    accept: (pairingId: string) => accept.mutate({ pairingId, callerEmail: email ?? '' }),
    accepting: accept.isPending,
    unpair: (pairingId: string) => unpair.mutate(pairingId),
    unpairing: unpair.isPending,
  };
}
