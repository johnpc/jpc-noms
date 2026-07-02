import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

type FormState = ReturnType<typeof baseForm>;
const baseForm = () => ({
  email: '',
  setEmail: vi.fn(),
  password: '',
  setPassword: vi.fn(),
  error: null as string | null,
  busy: false,
  submit: vi.fn(),
});
const form = vi.hoisted(() => ({ value: {} as FormState }));
vi.mock('./useSignInForm', () => ({ useSignInForm: () => form.value }));

import { SignIn } from './SignIn';

function renderSignIn() {
  return render(
    <MemoryRouter>
      <SignIn />
    </MemoryRouter>,
  );
}

describe('SignIn', () => {
  beforeEach(() => {
    form.value = baseForm();
  });

  it('submits the form on the CTA click', () => {
    renderSignIn();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(form.value.submit).toHaveBeenCalled();
  });

  it('shows an error and a busy label', () => {
    form.value = { ...baseForm(), error: 'nope', busy: true };
    renderSignIn();
    expect(screen.getByText('nope')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  });
});
