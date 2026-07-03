/**
 * Google Places API edges (network). Thin wrappers around fetch so the
 * handlers stay testable — mocked in handler tests. The API key comes from
 * Secrets Manager (GOOGLE_SECRET_ARN, JSON { GOOGLE_PLACES_API_KEY }), fetched
 * once per warm container and cached — same pattern as the Tessie edge, so it
 * works identically in sandbox and the Amplify prod build (no build-time env).
 */
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { RawPlace } from './placeShape';

const BASE = 'https://places.googleapis.com/v1';
const SEARCH_FIELDS =
  'places.id,places.name,places.formattedAddress,places.websiteUri,places.priceLevel,places.displayName,places.primaryTypeDisplayName,places.editorialSummary,places.generativeSummary,places.photos';
const DETAIL_FIELDS =
  'id,name,formattedAddress,websiteUri,priceLevel,displayName,primaryTypeDisplayName,editorialSummary,generativeSummary,photos';

const sm = new SecretsManagerClient({});
let cachedKey: string | null = null;

const key = async (): Promise<string> => {
  if (cachedKey) return cachedKey;
  const arn = process.env.GOOGLE_SECRET_ARN;
  if (!arn) throw new Error('GOOGLE_SECRET_ARN not set');
  const res = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
  const parsed = JSON.parse(res.SecretString ?? '{}') as { GOOGLE_PLACES_API_KEY?: string };
  if (!parsed.GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY missing from secret');
  cachedKey = parsed.GOOGLE_PLACES_API_KEY;
  return cachedKey;
};

/** Text search biased to a location. Returns the raw `places` array. */
export async function searchText(input: {
  latitude: number;
  longitude: number;
  openNow: boolean;
  search: string;
}): Promise<RawPlace[]> {
  const apiKey = await key();
  const res = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': SEARCH_FIELDS,
    },
    body: JSON.stringify({
      textQuery: input.search || 'food',
      openNow: input.openNow,
      pageSize: 20,
      languageCode: 'en',
      locationBias: {
        circle: {
          center: { latitude: input.latitude, longitude: input.longitude },
          radius: 2000.0,
        },
      },
    }),
  });
  const json = (await res.json()) as { places?: RawPlace[] };
  return json.places ?? [];
}

/** Detail lookup for one place id. */
export async function placeDetail(placeId: string): Promise<RawPlace> {
  const apiKey = await key();
  const res = await fetch(`${BASE}/${placeId}?languageCode=en&fields=${DETAIL_FIELDS}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
  });
  return (await res.json()) as RawPlace;
}

/** Resolve a Places photo resource name to a hosted image URI. */
export async function photoUri(photoId: string, widthPx = 400, heightPx = 400): Promise<string> {
  const apiKey = await key();
  const url = `${BASE}/${photoId}/media?maxHeightPx=${heightPx}&maxWidthPx=${widthPx}&key=${apiKey}&skipHttpRedirect=true`;
  const res = await fetch(url, { method: 'GET' });
  const json = (await res.json()) as { photoUri?: string };
  return json.photoUri ?? '';
}
