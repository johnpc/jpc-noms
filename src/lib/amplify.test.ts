import { describe, it, expect, vi } from 'vitest';

const configure = vi.fn();
vi.mock('aws-amplify', () => ({ Amplify: { configure } }));
vi.mock('../../amplify_outputs.json', () => ({ default: { auth: { region: 'us-west-2' } } }));

describe('amplify config', () => {
  it('configures Amplify with the generated outputs on import', async () => {
    const mod = await import('./amplify');
    expect(configure).toHaveBeenCalledWith(mod.outputs);
  });
});
