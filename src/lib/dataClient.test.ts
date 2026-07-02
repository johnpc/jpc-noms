import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchAuthSession = vi.hoisted(() => vi.fn());
vi.mock('aws-amplify/data', () => ({ generateClient: () => ({ models: {} }) }));
vi.mock('aws-amplify/auth', () => ({ fetchAuthSession }));

import { readAuthMode } from './dataClient';

describe('readAuthMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns userPool when a Cognito access token exists', async () => {
    fetchAuthSession.mockResolvedValue({ tokens: { accessToken: 'tok' } });
    expect(await readAuthMode()).toBe('userPool');
  });

  it('returns identityPool when there is no token (guest)', async () => {
    fetchAuthSession.mockResolvedValue({ tokens: undefined });
    expect(await readAuthMode()).toBe('identityPool');
  });

  it('falls back to identityPool when the session lookup throws', async () => {
    fetchAuthSession.mockRejectedValue(new Error('no session'));
    expect(await readAuthMode()).toBe('identityPool');
  });
});
