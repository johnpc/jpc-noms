/**
 * Tessie API edge — sets the car's navigation (the recovered eats mechanism):
 * POST api.tessie.com/{VIN}/command/share?value={address}.
 *
 * Credentials live in Secrets Manager (NOT plaintext env — this literally
 * drives the car), at the ARN in TESSIE_SECRET_ARN, as JSON
 * { TESSIE_API_KEY, TESLA_VIN }. Fetched once per warm container and cached.
 * No-op when the secret is unset/unreadable so the pipeline is inert-safe.
 * Mocked in the handler test.
 */
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const sm = new SecretsManagerClient({});
let cached: { key: string; vin: string } | null = null;

async function creds(): Promise<{ key: string; vin: string } | null> {
  if (cached) return cached;
  const arn = process.env.TESSIE_SECRET_ARN;
  if (!arn) return null;
  const res = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
  if (!res.SecretString) return null;
  const parsed = JSON.parse(res.SecretString) as { TESSIE_API_KEY?: string; TESLA_VIN?: string };
  if (!parsed.TESSIE_API_KEY || !parsed.TESLA_VIN) return null;
  cached = { key: parsed.TESSIE_API_KEY, vin: parsed.TESLA_VIN };
  return cached;
}

/** Send a navigation share to the car. No-op when the secret is unconfigured. */
export async function sendNavigation(address: string): Promise<void> {
  const c = await creds();
  if (!c) {
    console.log('TESSIE_SECRET_ARN unset/unreadable — skipping Tesla nav (inert).');
    return;
  }
  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://api.tessie.com/${c.vin}/command/share?value=${encoded}&locale=en-US`,
    { method: 'POST', headers: { Authorization: `Bearer ${c.key}` } },
  );
  console.log(`Sent "${address}" to Tesla:`, res.status);
}
