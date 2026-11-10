import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteForm from './NoteForm';
import { ApiClientError } from '@/lib/ApiClientError';

describe('NoteForm', () => {
  it('pre-fills from initialValues when editing', () => {
    render(
      <NoteForm
        initialValues={{ title: 'Existing', content: 'Body' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Save changes"
      />
    );

    expect(screen.getByLabelText('Title')).toHaveValue('Existing');
    expect(screen.getByLabelText('Content')).toHaveValue('Body');
  });

  it('shows Yup validation errors and does not call onSubmit when fields are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NoteForm initialValues={null} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Create" />);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Content is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the validated values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm initialValues={null} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Create" />);

    await user.type(screen.getByLabelText('Title'), 'My title');
    await user.type(screen.getByLabelText('Content'), 'My content');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'My title', content: 'My content' });
  });

  it('shows the API error message when onSubmit rejects with an ApiClientError', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiClientError(400, 'Something went wrong on the server'));
    render(<NoteForm initialValues={null} onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Create" />);

    await user.type(screen.getByLabelText('Title'), 'T');
    await user.type(screen.getByLabelText('Content'), 'C');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Something went wrong on the server')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<NoteForm initialValues={null} onSubmit={vi.fn()} onCancel={onCancel} submitLabel="Create" />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
