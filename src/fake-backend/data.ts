/**
 * Stand-in for `aws-amplify/data` (Vite aliases it here in fake mode). The
 * typed Schema client the app imports is produced from the same model names
 * + index queries the real schema declares (amplify/data/resource.ts), so
 * app code needs no changes and no `any` — the shim is cast once, here.
 */
import { modelApi, type AuthOpts, type Result } from './models';
import { queries, mutations } from './queries';
import type { Row } from './db';

const Nom = modelApi('Nom', 'members');
const Pairing = modelApi('Pairing', 'authenticated');

/** `index('pairingId').sortKeys(['updatedAt'])` — the recent-noms poll. */
async function listNomByPairingIdAndUpdatedAt(
  args: { pairingId: string },
  opts?: AuthOpts & { sortDirection?: 'ASC' | 'DESC'; limit?: number },
): Promise<Result<Row[]>> {
  const { data } = await Nom.list(opts);
  const mine = data.filter((n) => n.pairingId === args.pairingId);
  mine.sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)));
  if (opts?.sortDirection === 'DESC') mine.reverse();
  return { data: opts?.limit ? mine.slice(0, opts.limit) : mine, nextToken: null };
}

/** `index('inviteeEmail')` — how an invitee finds the invite addressed to them. */
async function listPairingByInviteeEmail(
  args: { inviteeEmail: string },
  opts?: AuthOpts,
): Promise<Result<Row[]>> {
  const { data } = await Pairing.list(opts);
  const email = args.inviteeEmail.trim().toLowerCase();
  return { data: data.filter((p) => p.inviteeEmail === email), nextToken: null };
}

export const fakeClient = {
  models: {
    GoogleApiCache: modelApi('GoogleApiCache', 'guest'),
    Rotation: modelApi('Rotation', 'owner'),
    Device: modelApi('Device', 'owner'),
    Pairing: { ...Pairing, listPairingByInviteeEmail },
    Nom: { ...Nom, listNomByPairingIdAndUpdatedAt },
  },
  queries,
  mutations,
};

/** Same call shape as the SDK's generateClient<Schema>(); returns the fake. */
export function generateClient<T>(_opts?: AuthOpts): T {
  return fakeClient as unknown as T;
}
