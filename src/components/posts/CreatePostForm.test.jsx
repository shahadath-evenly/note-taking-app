import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePostForm from './CreatePostForm';
import { ApiClientError } from '@/lib/ApiClientError';

describe('CreatePostForm', () => {
  it('shows validation errors and never calls onSubmit when fields are blank', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CreatePostForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Post' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Content is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the validated values and clears the form on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<CreatePostForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Title'), 'My title');
    await user.type(screen.getByLabelText('Content'), 'My content');
    await user.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: 'My title', content: 'My content' }));
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue(''));
    expect(screen.getByLabelText('Content')).toHaveValue('');
  });

  it('shows the backend error message when submission fails, keeping the entered values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiClientError(500, 'Server exploded'));
    render(<CreatePostForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Title'), 'My title');
    await user.type(screen.getByLabelText('Content'), 'My content');
    await user.click(screen.getByRole('button', { name: 'Post' }));

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('My title');
  });
});
