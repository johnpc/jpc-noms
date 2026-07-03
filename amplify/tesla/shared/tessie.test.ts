import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(() => ({ send })),
  GetSecretValueCommand: vi.fn((input) => ({ input })),
}));

import { sendNavigation } from './tessie';

describe('sendNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    delete process.env.TESSIE_SECRET_ARN;
  });

  it('no-ops when the secret ARN is unset', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await sendNavigation('1 Main St');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('reads creds from Secrets Manager and POSTs the share command', async () => {
    process.env.TESSIE_SECRET_ARN = 'arn:secret';
    send.mockResolvedValue({
      SecretString: JSON.stringify({ TESSIE_API_KEY: 'key', TESLA_VIN: 'VIN123' }),
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 200 } as Response);
    await sendNavigation('1 Main St, Ann Arbor');
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(
      'https://api.tessie.com/VIN123/command/share?value=1%20Main%20St%2C%20Ann%20Arbor&locale=en-US',
    );
    expect((init as RequestInit).headers).toEqual({ Authorization: 'Bearer key' });
  });
});
