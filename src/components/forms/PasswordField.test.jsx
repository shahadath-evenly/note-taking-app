import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordField from './PasswordField';

describe('PasswordField', () => {
  it('renders as a password input by default, hiding the typed value', () => {
    render(<PasswordField label="Password" name="password" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('reveals the value as plain text when the show-password toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" name="password" value="Sup3rSecret!" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('hides the value again when the toggle is clicked a second time', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" name="password" value="Sup3rSecret!" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    await user.click(screen.getByRole('button', { name: 'Hide password' }));

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('shows a field error when provided', () => {
    render(<PasswordField label="Password" name="password" value="" onChange={vi.fn()} error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });
});
