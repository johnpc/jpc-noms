import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const baseForm = () => ({
  phase: 'request' as 'request' | 'confirm',
  email: 'a@b.com',
  setEmail: vi.fn(),
  code: '',
  setCode: vi.fn(),
  password: '',
  setPassword: vi.fn(),
  error: null as string | null,
  busy: false,
  submitEmail: vi.fn(),
  submitReset: vi.fn(),
});
const form = vi.hoisted(() => ({ value: {} as ReturnType<typeof baseForm> }));
vi.mock('./useResetPasswordForm', () => ({ useResetPasswordForm: () => form.value }));

import { ResetPassword } from './ResetPassword';

function renderReset() {
  return render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>,
  );
}

describe('ResetPassword', () => {
  beforeEach(() => {
    form.value = baseForm();
  });

  it('sends the reset code in the request phase', () => {
    renderReset();
    fireEvent.click(screen.getByRole('button', { name: 'Send reset code' }));
    expect(form.value.submitEmail).toHaveBeenCalled();
  });

  it('shows the confirm phase and submits the new password', () => {
    form.value = { ...baseForm(), phase: 'confirm' };
    renderReset();
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(form.value.submitReset).toHaveBeenCalled();
  });

  it('shows an error message', () => {
    form.value = { ...baseForm(), error: 'no such user' };
    renderReset();
    expect(screen.getByText('no such user')).toBeInTheDocument();
  });
});
