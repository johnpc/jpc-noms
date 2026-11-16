import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import {
  usePairing as usePairingQuery,
  useCreatePairing,
  useAcceptPairing,
  useUnpair,
} from './pairingApi';
import { usePairingRealtime } from './usePairingRealtime';
import { pairingScreen } from './pairing';

/**
 * Pairing-page logic: ONE `screen` union (signed-out / loading / none /
 * pending-sent / pending-received / active) from the caller's pairing, plus
 * invite + accept + unpair actions. Kept live via the Pairing subscription so
 * both apps reflect a scan-to-pair instantly.
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

  return {
    screen: pairingScreen(signedIn, query.isLoading, query.data ?? null, email ?? ''),
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
