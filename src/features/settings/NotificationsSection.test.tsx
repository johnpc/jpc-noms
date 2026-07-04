import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ useNotifications: vi.fn() }));
vi.mock('./useNotifications', () => ({ useNotifications: h.useNotifications }));

import { NotificationsSection } from './NotificationsSection';

const base = {
  state: 'prompt',
  working: false,
  enable: vi.fn(),
  disable: vi.fn(),
  openIosSettings: vi.fn(),
};

describe('NotificationsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing on web (push is iOS-only)', () => {
    h.useNotifications.mockReturnValue({ ...base, state: 'web' });
    const { container } = render(<NotificationsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers Turn on when off, and fires enable', () => {
    h.useNotifications.mockReturnValue({ ...base, state: 'off' });
    render(<NotificationsSection />);
    expect(screen.getByTestId('notif-status')).toHaveTextContent('Off');
    fireEvent.click(screen.getByTestId('notif-enable'));
    expect(base.enable).toHaveBeenCalled();
  });

  it('offers Turn off when on, and fires disable', () => {
    h.useNotifications.mockReturnValue({ ...base, state: 'on' });
    render(<NotificationsSection />);
    expect(screen.getByTestId('notif-status')).toHaveTextContent('On');
    fireEvent.click(screen.getByTestId('notif-disable'));
    expect(base.disable).toHaveBeenCalled();
  });

  it('links to iOS Settings when blocked', () => {
    h.useNotifications.mockReturnValue({ ...base, state: 'denied' });
    render(<NotificationsSection />);
    expect(screen.getByTestId('notif-status')).toHaveTextContent('Blocked in iOS');
    fireEvent.click(screen.getByTestId('notif-open-settings'));
    expect(base.openIosSettings).toHaveBeenCalled();
  });

  it('always offers an explicit "Register this device" that fires enable', () => {
    h.useNotifications.mockReturnValue({ ...base, state: 'on' });
    render(<NotificationsSection />);
    fireEvent.click(screen.getByTestId('notif-register'));
    expect(base.enable).toHaveBeenCalled();
  });

  it('surfaces the last push diagnostic when present', () => {
    h.useNotifications.mockReturnValue({
      ...base,
      state: 'on',
      lastError: 'APNs registrationError: x',
    });
    render(<NotificationsSection />);
    expect(screen.getByTestId('notif-error')).toHaveTextContent('registrationError');
  });
});
