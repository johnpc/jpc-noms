import { useAuth } from '../auth/useAuth';
import { usePairing } from '../pairing/pairingApi';
import type { Actor } from './nomWrite';

/**
 * Who a new nom belongs to. Shared by the create/add flows so the pairing
 * rules live in one place: a nom is solo (members: [self]) until an ACTIVE
 * pairing exists, then shared between both partners. `actor` stamps writes so
 * the push Lambda can credit whoever acted.
 */
export function useNomMembership(enabled = true) {
  const { status, email, sub } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: pairing } = usePairing(signedIn && enabled);
  const active = pairing?.status === 'ACTIVE' ? pairing : null;

  const actor: Actor = { sub: sub ?? '', label: email ?? '' };
  return {
    signedIn,
    paired: !!active,
    sub,
    actor,
    pairingId: active ? active.id : 'solo',
    members: active ? active.members : sub ? [sub] : [],
  };
}
