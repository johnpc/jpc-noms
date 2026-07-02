import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthField } from './AuthField';

describe('AuthField', () => {
  it('renders the label and current value', () => {
    render(<AuthField label="Email" type="email" value="a@b.com" onChange={vi.fn()} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByDisplayValue('a@b.com')).toBeInTheDocument();
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<AuthField label="Email" type="email" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x@y.com' } });
    expect(onChange).toHaveBeenCalledWith('x@y.com');
  });
});
