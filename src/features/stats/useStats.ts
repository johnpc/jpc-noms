import { useAuth } from '../auth/useAuth';
import { useNoms } from '../noms/nomsApi';
import { useNomsRealtime } from '../noms/useNomsRealtime';
import { screenGate, type GateScreen } from '../../lib/screenGate';
import { computeNomStats, type NomStats } from './nomStats';

// @state-machine stats-screen
export type StatsScreen = GateScreen | { kind: 'empty' } | { kind: 'ready'; stats: NomStats };

/** Pure: signed-out / loading, then empty (no decisions yet) or the stats. */
export function statsScreen(signedIn: boolean, loading: boolean, stats: NomStats): StatsScreen {
  const gate = screenGate(signedIn, loading);
  if (gate) return gate;
  return stats.decidedCount === 0 ? { kind: 'empty' } : { kind: 'ready', stats };
}

/**
 * Stats logic: ONE `screen` union over counts + decided-history derived from the
 * caller's shared noms. Kept live via the noms subscription, so a fresh
 * selection shows up instantly.
 */
export function useStats() {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: noms = [], isLoading } = useNoms(signedIn);
  useNomsRealtime(signedIn);

  return { screen: statsScreen(signedIn, isLoading, computeNomStats(noms)) };
}
