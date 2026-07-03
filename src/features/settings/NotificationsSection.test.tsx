import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ useNotifications: vi.fn() }));
vi.mock('./useNotifications', () => ({ useNotifications: h.useNotifications }));

import { NotificationsSection } from './NotificationsSection';

const base = { status: 'prompt', working: false, enable: vi.fn(), openIosSettings: vi.fn() };

describe('NotificationsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing on web (push is iOS-only)', () => {
    h.useNotifications.mockReturnValue({ ...base, status: 'web' });
    const { container } = render(<NotificationsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers Enable when push is off, and fires it', () => {
    h.useNotifications.mockReturnValue(base);
    render(<NotificationsSection />);
    expect(screen.getByTestId('notif-status')).toHaveTextContent('Off');
    fireEvent.click(screen.getByTestId('notif-enable'));
    expect(base.enable).toHaveBeenCalled();
  });

  it('shows granted state with no action button', () => {
    h.useNotifications.mockReturnValue({ ...base, status: 'granted' });
    render(<NotificationsSection />);
    expect(screen.getByTestId('notif-status')).toHaveTextContent('On');
    expect(screen.queryByTestId('notif-enable')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notif-open-settings')).not.toBeInTheDocument();
  });

  it('links to iOS Settings when blocked', () => {
    h.useNotifications.mockReturnValue({ ...base, status: 'denied' });
    render(<NotificationsSection />);
    expect(screen.getByTestId('notif-status')).toHaveTextContent('Blocked in iOS');
    fireEvent.click(screen.getByTestId('notif-open-settings'));
    expect(base.openIosSettings).toHaveBeenCalled();
  });
});
