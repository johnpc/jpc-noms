/**
 * Pure text for a "poke" push — no I/O, unit-tested. Someone taps "poke your
 * partner" and the partner gets a nudge notification. `fromLabel` is the
 * poker's display name (email); falls back to a generic nudge.
 */
export interface PokeNotification {
  title: string;
  body: string;
}

export function decidePoke(fromLabel: string | undefined): PokeNotification {
  const who = fromLabel?.trim();
  return {
    title: 'jpc.noms',
    body: who
      ? `👋 ${who} poked you — what's for dinner?`
      : "👋 You've been poked — what's for dinner?",
  };
}
