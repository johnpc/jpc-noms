import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { searchPlacesFunction } from '../places/searchPlaces/resource';
import { getPlaceFunction } from '../places/getPlace/resource';
import { getPlaceImageFunction } from '../places/getPlaceImage/resource';

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
