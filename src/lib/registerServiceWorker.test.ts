import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerServiceWorker } from './registerServiceWorker';

describe('registerServiceWorker', () => {
  const original = navigator.serviceWorker;

  function setServiceWorker(value: unknown) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value,
      configurable: true,
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setServiceWorker(original);
  });

  it('does nothing when service workers are unsupported', () => {
    // Remove the property entirely — `'serviceWorker' in navigator` checks for
    // existence, not value, so setting it to undefined wouldn't trip the guard.
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
    const addEventListener = vi.spyOn(window, 'addEventListener');
    registerServiceWorker();
    expect(addEventListener).not.toHaveBeenCalledWith('load', expect.anything(), expect.anything());
  });

  it('registers /sw.js once the window load event fires', () => {
    const register = vi.fn().mockResolvedValue(undefined);
    setServiceWorker({ register });
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('swallows registration errors so the app still boots', async () => {
    const register = vi.fn().mockRejectedValue(new Error('nope'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setServiceWorker({ register });
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    // Let the rejected register() promise settle and its .catch run.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(register).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });
});
