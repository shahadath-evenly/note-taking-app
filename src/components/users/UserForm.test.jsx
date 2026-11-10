import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserForm from './UserForm';
import { ApiClientError } from '@/lib/ApiClientError';

describe('UserForm: create mode', () => {
  it('shows a password field and requires it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UserForm initialValues={null} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Create" />);

    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    // The schema chains .min(8) before .required() — with an empty value,
    // Yup's abortEarly:false reports both, and validateForm keeps the first
    // one per field, so the length message wins over "is required" (the
    // same behavior the backend's identical schema shape has).
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits with role, interests parsed from comma-separated text, and defaults role to user', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<UserForm initialValues={null} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Create" />);

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'Sup3rSecret!');
    await user.type(screen.getByLabelText('Interests (comma-separated)'), 'chess, reading ,  math');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Sup3rSecret!',
      role: 'user',
      interests: ['chess', 'reading', 'math'],
    });
  });

  it('allows selecting the admin role', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<UserForm initialValues={null} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Create" />);

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'Sup3rSecret!');
    await user.selectOptions(screen.getByLabelText('Role'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
  });
});

describe('UserForm: edit mode', () => {
  const existingUser = {
    _id: '1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'admin',
    interests: ['chess'],
  };

  it('pre-fills fields and hides the password field entirely', () => {
    render(<UserForm initialValues={existingUser} onSubmit={vi.fn()} onCancel={vi.fn()} submitLabel="Save changes" />);

    expect(screen.getByLabelText('First name')).toHaveValue('Ada');
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    expect(screen.getByLabelText('Role')).toHaveValue('admin');
    expect(screen.getByLabelText('Interests (comma-separated)')).toHaveValue('chess');
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('rejects clearing the first name, mirroring the backend\'s required-field rule', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UserForm initialValues={existingUser} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Save changes" />);

    await user.clear(screen.getByLabelText('First name'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the edited values without a password field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<UserForm initialValues={existingUser} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Save changes" />);

    await user.selectOptions(screen.getByLabelText('Role'), 'user');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'user',
      interests: ['chess'],
    });
  });

  it('shows the API error message when onSubmit rejects', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiClientError(409, 'email already exists'));
    render(<UserForm initialValues={existingUser} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Save changes" />);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('email already exists')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<UserForm initialValues={existingUser} onSubmit={vi.fn()} onCancel={onCancel} submitLabel="Save changes" />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
