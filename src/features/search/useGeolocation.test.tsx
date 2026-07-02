import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getCurrentPosition = vi.hoisted(() => vi.fn());
vi.mock('@capacitor/geolocation', () => ({ Geolocation: { getCurrentPosition } }));

import { useGeolocation, DEFAULT_COORDS } from './useGeolocation';

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('starts from the default when nothing is stored', () => {
    getCurrentPosition.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useGeolocation());
    expect(result.current).toEqual(DEFAULT_COORDS);
  });

  it('updates to and persists a real fix', async () => {
    getCurrentPosition.mockResolvedValue({ coords: { latitude: 40, longitude: -74 } });
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current).toEqual({ latitude: 40, longitude: -74 }));
    expect(JSON.parse(localStorage.getItem('noms.coordinates') as string)).toEqual({
      latitude: 40,
      longitude: -74,
    });
  });

  it('keeps the stored fix when the device denies location', async () => {
    localStorage.setItem('noms.coordinates', JSON.stringify({ latitude: 10, longitude: 20 }));
    getCurrentPosition.mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useGeolocation());
    expect(result.current).toEqual({ latitude: 10, longitude: 20 });
  });
});
