import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { searchPlacesFunction } from '../places/searchPlaces/resource';
import { getPlaceFunction } from '../places/getPlace/resource';
import { getPlaceImageFunction } from '../places/getPlaceImage/resource';
import { createPairingFunction } from '../pairing/createPairing/resource';
import { acceptPairingFunction } from '../pairing/acceptPairing/resource';
import { pokeFunction } from '../notify/poke/resource';

/**
 * Noms data schema.
 *
 * Auth contract (stoop ADR 0004): the client's `authMode` must name the same
 * provider as a model's `allow.*` rule or reads come back empty (not an error).
 * The shared client defaults to `identityPool` (guest) and upgrades signed-in
 * users to `userPool` via readAuthMode() — see src/lib/dataClient.ts.
 */
const schema = a
  .schema({
    // Google Places response cache. `hash` GSI keys both the search/detail
    // cache lookups AND the Tesla nav lookup (a selected place's address).
    GoogleApiCache: a
      .model({
        hash: a.string().required(),
        value: a.string().required(),
        source: a.string(),
      })
      .secondaryIndexes((index) => [index('hash')])
      .authorization((allow) => [
        allow.guest().to(['read']),
        allow.authenticated('identityPool').to(['read']),
        allow.authenticated().to(['read']),
        allow.group('editors').to(['create', 'update', 'delete']),
      ]),

    // A user's saved-favorite restaurants ("the rotation"). Per-user (owner).
    Rotation: a
      .model({
        googlePlaceId: a.string().required(),
      })
      .authorization((allow) => [allow.owner()]),

    // The household of two. `members` holds both partners' Cognito subs and
    // grants each read/write (ownersDefinedIn). Created by the inviter (their
    // sub + the invitee's email, status PENDING); the acceptPairing Lambda adds
    // the invitee's sub to `members` and flips it to ACTIVE. inviterEmail /
    // inviteeEmail let each side find their pairing before both subs are known.
    Pairing: a
      .model({
        members: a.string().array().required(),
        inviterEmail: a.string().required(),
        inviteeEmail: a.string().required(),
        status: a.enum(['PENDING', 'ACTIVE']),
      })
      .secondaryIndexes((index) => [index('inviteeEmail')])
      .authorization((allow) => [
        allow.ownersDefinedIn('members'),
        allow.authenticated().to(['read']),
      ]),

    // The shared, collaborative nom — the heart of the app. `members` mirrors
    // the pairing's members, so BOTH partners can read AND write the same row
    // (ownersDefinedIn). Either can add options (optionPlaceIds) or mark one
    // selected; onCreate/onUpdate subscriptions push the change live to the
    // other, and the Nom stream drives push (slice 5) + Tesla nav (slice 6).
    Nom: a
      .model({
        pairingId: a.string().required(),
        members: a.string().array().required(),
        title: a.string(),
        optionPlaceIds: a.string().array().required(),
        selectedPlaceId: a.string(),
        selectedBy: a.string(),
        status: a.enum(['OPEN', 'SELECTED']),
        // Cognito sub of whoever last added/selected — the push Lambda notifies
        // the OTHER member(s), and includes a human note (lastActionText).
        lastActorSub: a.string(),
        lastActionText: a.string(),
      })
      .secondaryIndexes((index) => [index('pairingId')])
      .authorization((allow) => [allow.ownersDefinedIn('members')]),

    // APNs device-token registry. Owner-auth: each user registers their own
    // device(s) after granting push permission. The push Lambda reads a
    // partner's tokens (by owner sub) via its IAM role to deliver.
    Device: a
      .model({
        token: a.string().required(),
        platform: a.string().required(),
        ownerSub: a.string().required(),
      })
      .secondaryIndexes((index) => [index('ownerSub')])
      .authorization((allow) => [allow.owner()]),

    GooglePlaceText: a.customType({
      text: a.string(),
      languageCode: a.string(),
    }),
    GooglePlace: a.customType({
      id: a.string().required(),
      name: a.string().required(),
      photos: a.string().array(),
      websiteUri: a.string(),
      formattedAddress: a.string(),
      priceLevel: a.string(),
      primaryTypeDisplayName: a.ref('GooglePlaceText'),
      displayName: a.ref('GooglePlaceText').required(),
      generativeSummary: a.ref('GooglePlaceText'),
      editorialSummary: a.ref('GooglePlaceText'),
    }),
    GooglePlaceImage: a.customType({
      name: a.string().required(),
      photoUri: a.string().required(),
    }),

    searchGooglePlaces: a
      .query()
      .arguments({
        latitude: a.float().required(),
        longitude: a.float().required(),
        openNow: a.boolean(),
        search: a.string(),
      })
      .returns(a.ref('GooglePlace').array().required())
      .authorization((allow) => [allow.authenticated(), allow.guest()])
      .handler(a.handler.function(searchPlacesFunction)),
    getGooglePlace: a
      .query()
      .arguments({ placeId: a.string().required() })
      .returns(a.ref('GooglePlace'))
      .authorization((allow) => [allow.authenticated(), allow.guest()])
      .handler(a.handler.function(getPlaceFunction)),
    getGooglePlaceImage: a
      .query()
      .arguments({
        photoId: a.string().required(),
        widthPx: a.integer(),
        heightPx: a.integer(),
      })
      .returns(a.ref('GooglePlaceImage'))
      .authorization((allow) => [allow.authenticated(), allow.guest()])
      .handler(a.handler.function(getPlaceImageFunction)),

    // Start a pairing: caller (inviter) names their partner's email. The
    // Lambda creates a PENDING Pairing owned by the inviter. Returns its id.
    // NB: named invitePartner (not createPairing) — the Pairing model already
    // auto-generates a createPairing mutation; a same-named custom mutation
    // collides ("Mutation cannot redeclare field createPairing").
    // callerEmail is passed as an argument (not read from a claim): AppSync's
    // userPool authorizer surfaces ACCESS-token claims, which don't include
    // `email` (that lives only on the ID token). The client supplies its own
    // signed-in email — the same trust model the QR pairing path already uses.
    invitePartner: a
      .mutation()
      .arguments({ inviteeEmail: a.string().required(), callerEmail: a.string().required() })
      .returns(a.ref('Pairing'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(createPairingFunction)),
    // Accept a pairing addressed to the caller's email: the Lambda adds the
    // caller's sub to `members` and flips status to ACTIVE.
    acceptInvite: a
      .mutation()
      .arguments({ pairingId: a.string().required(), callerEmail: a.string().required() })
      .returns(a.ref('Pairing'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(acceptPairingFunction)),
    // Poke your partner: an on-demand nudge push (not stream-driven). The Lambda
    // pushes to partnerSub's devices. Returns the number of devices notified.
    pokePartner: a
      .mutation()
      .arguments({ partnerSub: a.string().required(), fromLabel: a.string() })
      .returns(a.integer())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(pokeFunction)),
  })
  .authorization((allow) => [
    allow.resource(searchPlacesFunction).to(['query', 'mutate']),
    allow.resource(getPlaceFunction).to(['query', 'mutate']),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
