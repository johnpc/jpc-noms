import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ showToast: vi.fn(), writeText: vi.fn() }));
vi.mock('../../lib/toast', () => ({ showToast: h.showToast }));

import { ShareSection, APP_STORE_URL } from './ShareSection';

describe('ShareSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: h.writeText } });
  });

  it('copies the App Store URL and confirms with a toast', async () => {
    h.writeText.mockResolvedValue(undefined);
    render(<ShareSection />);
    fireEvent.click(screen.getByTestId('share-app'));
    await waitFor(() => expect(h.writeText).toHaveBeenCalledWith(APP_STORE_URL));
    expect(h.showToast).toHaveBeenCalledWith(expect.stringContaining('copied'));
  });

  it('falls back to showing the URL when clipboard fails', async () => {
    h.writeText.mockRejectedValue(new Error('no clipboard'));
    render(<ShareSection />);
    fireEvent.click(screen.getByTestId('share-app'));
    await waitFor(() => expect(h.showToast).toHaveBeenCalledWith(APP_STORE_URL));
  });
});
