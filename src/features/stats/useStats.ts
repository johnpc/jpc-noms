import { useAuth } from '../auth/useAuth';
import { useNoms } from '../noms/nomsApi';
import { useNomsRealtime } from '../noms/useNomsRealtime';
import { computeNomStats } from './nomStats';

/**
 * Stats logic: derive counts + decided-history from the caller's shared noms.
 * Kept live via the noms subscription, so a fresh selection shows up instantly.
 */
export function useStats() {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: noms = [], isLoading } = useNoms(signedIn);
  useNomsRealtime(signedIn);

  return { signedIn, loading: isLoading, stats: computeNomStats(noms) };
}
