import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteEditor from './NoteEditor';
import { ApiClientError } from '@/lib/ApiClientError';

describe('NoteEditor: empty state', () => {
  it('shows a placeholder when no note is selected', () => {
    render(<NoteEditor note={null} isDraft={false} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Select a note, or create a new one.')).toBeInTheDocument();
  });
});

describe('NoteEditor: creating a draft', () => {
  it('"Create note" is disabled until a title is typed', async () => {
    const user = userEvent.setup();
    render(<NoteEditor note={{ title: '', content: '' }} isDraft onSave={vi.fn()} onDelete={vi.fn()} />);

    const createButton = screen.getByRole('button', { name: 'Create note' });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText('Title'), 'My new note');
    expect(createButton).toBeEnabled();
  });

  it('is enabled by title alone — content stays optional', async () => {
    const user = userEvent.setup();
    render(<NoteEditor note={{ title: '', content: '' }} isDraft onSave={vi.fn()} onDelete={vi.fn()} />);

    await user.type(screen.getByLabelText('Title'), 'Title only');
    expect(screen.getByRole('button', { name: 'Create note' })).toBeEnabled();
  });

  it('calls onSave with the title/content and never shows a Delete button for a draft', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NoteEditor note={{ title: '', content: '' }} isDraft onSave={onSave} onDelete={vi.fn()} />);

    await user.type(screen.getByLabelText('Title'), 'New note');
    await user.type(screen.getByLabelText('Content'), 'Some content');
    await user.click(screen.getByRole('button', { name: 'Create note' }));

    expect(onSave).toHaveBeenCalledWith({ title: 'New note', content: 'Some content' });
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('enforces the 150-character title limit via maxLength', () => {
    render(<NoteEditor note={{ title: '', content: '' }} isDraft onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByLabelText('Title')).toHaveAttribute('maxLength', '150');
  });
});

describe('NoteEditor: editing an existing note', () => {
  const existingNote = { _id: '1', title: 'Existing title', content: 'Existing content' };

  it('pre-fills the title and content', () => {
    render(<NoteEditor note={existingNote} isDraft={false} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByLabelText('Title')).toHaveValue('Existing title');
    expect(screen.getByLabelText('Content')).toHaveValue('Existing content');
  });

  it('"Update" starts disabled and only activates once the content changes', async () => {
    const user = userEvent.setup();
    render(<NoteEditor note={existingNote} isDraft={false} onSave={vi.fn()} onDelete={vi.fn()} />);

    const updateButton = screen.getByRole('button', { name: 'Update' });
    expect(updateButton).toBeDisabled();

    await user.type(screen.getByLabelText('Content'), ' more');
    expect(updateButton).toBeEnabled();
  });

  it('disables Update again if the title is cleared out', async () => {
    const user = userEvent.setup();
    render(<NoteEditor note={existingNote} isDraft={false} onSave={vi.fn()} onDelete={vi.fn()} />);

    await user.type(screen.getByLabelText('Content'), ' more');
    const titleInput = screen.getByLabelText('Title');
    await user.clear(titleInput);

    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  });

  it('calls onSave with the edited values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NoteEditor note={existingNote} isDraft={false} onSave={onSave} onDelete={vi.fn()} />);

    const titleInput = screen.getByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(onSave).toHaveBeenCalledWith({ title: 'Updated title', content: 'Existing content' });
  });

  it('shows the Delete button and calls onDelete with the note', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<NoteEditor note={existingNote} isDraft={false} onSave={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(existingNote);
  });

  it('shows the API error message when onSave rejects', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new ApiClientError(400, 'Title cannot be empty'));
    render(<NoteEditor note={existingNote} isDraft={false} onSave={onSave} onDelete={vi.fn()} />);

    await user.type(screen.getByLabelText('Content'), ' more');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Title cannot be empty')).toBeInTheDocument();
  });

  it('resets its local editing state when a different note is selected', () => {
    const { rerender } = render(<NoteEditor note={existingNote} isDraft={false} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByLabelText('Title')).toHaveValue('Existing title');

    rerender(
      <NoteEditor
        note={{ _id: '2', title: 'Another note', content: 'Another content' }}
        isDraft={false}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Title')).toHaveValue('Another note');
  });
});
