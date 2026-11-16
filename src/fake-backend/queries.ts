/**
 * Fake resolvers for the Google Places queries + the custom mutations. Search
 * is the seeded fixture set for ANY term (there is no Google here); the one
 * term `nowhere` returns nothing so the empty state stays demoable.
 */
import { table, type Row } from './db';
import { currentSessionSub } from './session';
import { modelApi, type AuthOpts, type Result } from './models';

/** Typing this exact term is the fake's "no results" switch. */
export const NO_RESULTS_TERM = 'nowhere';

const places = () => table('GoogleApiCache').map((r) => JSON.parse(r.value as string) as Row);

export const queries = {
  searchGooglePlaces: async (args: { search?: string | null }): Promise<Result<Row[]>> => ({
    data: (args.search ?? '').trim().toLowerCase() === NO_RESULTS_TERM ? [] : places(),
  }),
  getGooglePlace: async (args: { placeId: string }): Promise<Result<Row | null>> => ({
    data: places().find((p) => p.id === args.placeId) ?? null,
  }),
  // The fixtures carry no photos, so there is never an image to resolve.
  getGooglePlaceImage: async (): Promise<Result<null>> => ({ data: null }),
};

const pairings = modelApi('Pairing', 'authenticated');
const norm = (e: string) => e.trim().toLowerCase();

export const mutations = {
  /** Inviter creates a PENDING pairing owned by themselves (members: [me]). */
  invitePartner: async (
    args: { inviteeEmail: string; callerEmail: string },
    opts?: AuthOpts,
  ): Promise<Result<Row | null>> => {
    if (norm(args.inviteeEmail) === norm(args.callerEmail)) {
      throw new Error('You cannot pair with yourself.');
    }
    const sub = currentSessionSub();
    return pairings.create(
      {
        members: sub ? [sub] : [],
        inviterEmail: norm(args.callerEmail),
        inviteeEmail: norm(args.inviteeEmail),
        status: 'PENDING',
      },
      opts,
    );
  },
  /** Invitee joins: add their sub to members and flip to ACTIVE. */
  acceptInvite: async (
    args: { pairingId: string; callerEmail: string },
    opts?: AuthOpts,
  ): Promise<Result<Row | null>> => {
    const { data } = await pairings.get({ id: args.pairingId }, opts);
    if (!data) throw new Error('Pairing not found.');
    if (data.inviteeEmail !== norm(args.callerEmail)) {
      throw new Error('This pairing invite is addressed to a different email.');
    }
    if (data.status === 'ACTIVE') return { data };
    const sub = currentSessionSub();
    const members = [...(data.members as string[]), ...(sub ? [sub] : [])];
    return pairings.update({ id: data.id, members, status: 'ACTIVE' }, opts);
  },
  /** A poke "delivers" to one device — there is no APNs in the fake. */
  pokePartner: async (): Promise<Result<number>> => ({ data: 1 }),
};
