import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const baseForm = () => ({
  phase: 'collect' as 'collect' | 'confirm',
  email: 'a@b.com',
  setEmail: vi.fn(),
  password: '',
  setPassword: vi.fn(),
  code: '',
  setCode: vi.fn(),
  error: null as string | null,
  busy: false,
  submitDetails: vi.fn(),
  submitCode: vi.fn(),
});
const form = vi.hoisted(() => ({ value: {} as ReturnType<typeof baseForm> }));
vi.mock('./useSignUpForm', () => ({ useSignUpForm: () => form.value }));

import { SignUp } from './SignUp';

function renderSignUp() {
  return render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>,
  );
}

describe('SignUp', () => {
  beforeEach(() => {
    form.value = baseForm();
  });

  it('submits account details in the collect phase', () => {
    renderSignUp();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(form.value.submitDetails).toHaveBeenCalled();
  });

  it('shows the confirm phase and submits the code', () => {
    form.value = { ...baseForm(), phase: 'confirm' };
    renderSignUp();
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(form.value.submitCode).toHaveBeenCalled();
  });

  it('shows an error message', () => {
    form.value = { ...baseForm(), error: 'weak password' };
    renderSignUp();
    expect(screen.getByText('weak password')).toBeInTheDocument();
  });
});
