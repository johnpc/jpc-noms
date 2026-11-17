/**
 * The fake backend's known-good baseline — the SAME shape amplify/seed/seed.ts
 * writes to a real sandbox (places in the cache, one favorite, one open nom
 * with an option, one decided nom), so the Gherkin suite asserts identical
 * data whichever backend it runs against.
 */
import { SEEDED_PLACES } from '../../amplify/seed/fixtures/places';
import type { Db } from './db';

/** The one account the fake knows on first boot (sign-up adds more). */
export const DEMO_USER = { email: 'demo@noms.test', password: 'noms-demo', sub: 'demo-user-1' };

/** The reset code / sign-up code the fake Cognito "emails". */
export const DEMO_CODE = '123456';

export function seedDb(): Db {
  const me = DEMO_USER.sub;
  const at = new Date().toISOString();
  // The decided nom is an hour older so "today's latest" is the OPEN one by
  // timestamp, never by array order.
  const earlier = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  return {
    tables: {
      accounts: [{ id: me, email: DEMO_USER.email, password: DEMO_USER.password, confirmed: true }],
      GoogleApiCache: SEEDED_PLACES.map((p) => ({
        id: `cache-${p.id}`,
        hash: p.id,
        value: JSON.stringify(p),
        source: 'seed',
      })),
      Rotation: [{ id: 'rot-1', googlePlaceId: SEEDED_PLACES[0].id, owner: me }],
      Pairing: [],
      Device: [],
      Nom: [
        {
          id: 'nom-open',
          pairingId: 'solo',
          members: [me],
          optionPlaceIds: [SEEDED_PLACES[1].id],
          status: 'OPEN',
          createdAt: at,
          updatedAt: at,
        },
        {
          id: 'nom-decided',
          pairingId: 'solo',
          members: [me],
          optionPlaceIds: [SEEDED_PLACES[0].id, SEEDED_PLACES[2].id],
          selectedPlaceId: SEEDED_PLACES[0].id,
          selectedBy: 'John',
          status: 'SELECTED',
          createdAt: earlier,
          updatedAt: earlier,
        },
      ],
    },
  };
}
