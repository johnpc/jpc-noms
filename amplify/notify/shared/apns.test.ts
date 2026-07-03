import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => ({ send })),
  CreatePlatformEndpointCommand: vi.fn((input) => ({ kind: 'endpoint', input })),
  PublishCommand: vi.fn((input) => ({ kind: 'publish', input })),
}));

import { pushToToken } from './apns';

describe('pushToToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.APNS_PLATFORM_ARN;
  });

  it('no-ops (no SNS calls) when APNS_PLATFORM_ARN is unset', async () => {
    await pushToToken('tok', 'Noms', 'hi');
    expect(send).not.toHaveBeenCalled();
  });

  it('creates an endpoint then publishes the aps payload when configured', async () => {
    process.env.APNS_PLATFORM_ARN = 'arn:aws:sns:...:app/APNS/noms';
    send.mockResolvedValueOnce({ EndpointArn: 'arn:endpoint' }).mockResolvedValueOnce({});
    await pushToToken('tok', 'Noms', 'John added a spot');
    expect(send.mock.calls[0][0].kind).toBe('endpoint');
    const publish = send.mock.calls[1][0].input;
    expect(publish.TargetArn).toBe('arn:endpoint');
    expect(publish.MessageStructure).toBe('json');
    expect(publish.Message).toContain('John added a spot');
  });
});
