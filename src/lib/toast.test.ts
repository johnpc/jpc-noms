import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ create: vi.fn(), present: vi.fn() }));
vi.mock('@ionic/core/components', () => ({ toastController: { create: h.create } }));
vi.mock('@ionic/core/components/ion-toast.js', () => ({ defineCustomElement: vi.fn() }));

import { showError, showToast, errorMessage } from './toast';

describe('toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.create.mockResolvedValue({ present: h.present });
  });

  it('showError creates + presents a danger toast', async () => {
    await showError('boom');
    expect(h.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom', color: 'danger' }),
    );
    expect(h.present).toHaveBeenCalled();
  });

  it('showError swallows failures', async () => {
    h.create.mockRejectedValue(new Error('no toast'));
    await expect(showError('x')).resolves.toBeUndefined();
  });

  it('showToast creates + presents a success toast', async () => {
    await showToast('added');
    expect(h.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'added', color: 'success' }),
    );
    expect(h.present).toHaveBeenCalled();
  });

  it('showToast swallows failures', async () => {
    h.create.mockRejectedValue(new Error('no toast'));
    await expect(showToast('x')).resolves.toBeUndefined();
  });

  it('errorMessage extracts an Error message or uses the fallback', () => {
    expect(errorMessage(new Error('nope'))).toBe('nope');
    expect(errorMessage('weird', 'fallback')).toBe('fallback');
    expect(errorMessage(new Error(''), 'fb')).toBe('fb');
  });
});
