import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesPage from './page';
import * as notesService from '@/services/notes/notes.service';
import { ApiClientError } from '@/lib/ApiClientError';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { role: 'user' }, token: 'fake-token' }),
}));

vi.mock('@/services/notes/notes.service');

const noteA = { _id: '1', title: 'First note', content: 'First content', createdAt: '2024-01-02T00:00:00.000Z' };
const noteB = { _id: '2', title: 'Second note', content: 'Second content', createdAt: '2024-01-01T00:00:00.000Z' };

function mockList(overrides = {}) {
  notesService.listNotes.mockResolvedValue({
    data: [noteA, noteB],
    pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
});

describe('NotesPage: list and selection', () => {
  it('lists the user\'s notes and shows a placeholder until one is selected', async () => {
    render(<NotesPage />);

    expect(await screen.findByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
    expect(screen.getByText('Select a note, or create a new one.')).toBeInTheDocument();
    expect(notesService.listNotes).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 50 }),
      'fake-token'
    );
  });

  it('selecting a note shows its full content in the editor (view requirement)', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByText('First note'));

    expect(screen.getByLabelText('Title')).toHaveValue('First note');
    expect(screen.getByLabelText('Content')).toHaveValue('First content');
  });

  it('shows an empty-state message when there are no notes', async () => {
    mockList({ data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } });
    render(<NotesPage />);
    expect(await screen.findByText('No notes found.')).toBeInTheDocument();
  });

  it('shows the backend error message when loading fails', async () => {
    notesService.listNotes.mockRejectedValue(new ApiClientError(500, 'Server exploded'));
    render(<NotesPage />);
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });
});

describe('NotesPage: create (draft flow)', () => {
  it('"New note" opens an empty, editable draft with Create note disabled until a title is typed', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByRole('button', { name: 'New note' }));

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Content')).toHaveValue('');
    const createButton = screen.getByRole('button', { name: 'Create note' });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText('Title'), 'New note title');
    expect(createButton).toBeEnabled();
  });

  it('creates the note with empty content when only a title is given, and selects it', async () => {
    const user = userEvent.setup();
    const createdNote = { _id: '3', title: 'Title only', content: '', createdAt: '2024-01-03T00:00:00.000Z' };
    notesService.createNote.mockResolvedValue({ data: createdNote });

    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByRole('button', { name: 'New note' }));
    await user.type(screen.getByLabelText('Title'), 'Title only');
    await user.click(screen.getByRole('button', { name: 'Create note' }));

    await waitFor(() =>
      expect(notesService.createNote).toHaveBeenCalledWith({ title: 'Title only', content: '' }, 'fake-token')
    );
    // The new note is prepended to the list without a full refetch.
    expect(await screen.findAllByText('Title only')).not.toHaveLength(0);
  });

  it('the draft is not persisted until Create note is clicked', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByRole('button', { name: 'New note' }));
    await user.type(screen.getByLabelText('Title'), 'Not saved yet');

    expect(notesService.createNote).not.toHaveBeenCalled();
  });

  it('clicking "New note" again while an unsaved draft is in progress resets to a blank draft', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByRole('button', { name: 'New note' }));
    await user.type(screen.getByLabelText('Title'), 'Abandoned draft text');

    await user.click(screen.getByRole('button', { name: 'New note' }));

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create note' })).toBeDisabled();
  });
});

describe('NotesPage: update', () => {
  it('Update is disabled until the content changes, then saves', async () => {
    const user = userEvent.setup();
    notesService.updateNote.mockResolvedValue({ data: { ...noteA, title: 'First note', content: 'Edited content' } });

    render(<NotesPage />);
    await screen.findByText('First note');
    await user.click(screen.getByText('First note'));

    const updateButton = screen.getByRole('button', { name: 'Update' });
    expect(updateButton).toBeDisabled();

    const contentInput = screen.getByLabelText('Content');
    await user.type(contentInput, ' more');
    expect(updateButton).toBeEnabled();

    await user.click(updateButton);

    await waitFor(() =>
      expect(notesService.updateNote).toHaveBeenCalledWith(
        '1',
        { title: 'First note', content: 'First content more' },
        'fake-token'
      )
    );
  });
});

describe('NotesPage: delete', () => {
  it('asks for confirmation and does not call the API on cancel', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');
    await user.click(screen.getByText('First note'));

    await user.click(screen.getByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Delete "First note"\?/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(notesService.deleteNote).not.toHaveBeenCalled();
  });

  it('deletes after confirmation and clears the editor', async () => {
    const user = userEvent.setup();
    notesService.deleteNote.mockResolvedValue({});

    render(<NotesPage />);
    await screen.findByText('First note');
    await user.click(screen.getByText('First note'));

    await user.click(screen.getByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(notesService.deleteNote).toHaveBeenCalledWith('1', 'fake-token'));
    expect(screen.getByText('Select a note, or create a new one.')).toBeInTheDocument();
  });
});

describe('NotesPage: pagination (load more) and search', () => {
  it('shows "Load more" only when another page exists, and appends results on click', async () => {
    const user = userEvent.setup();
    mockList({ pagination: { page: 1, limit: 50, total: 100, totalPages: 2 } });

    render(<NotesPage />);
    await screen.findByText('First note');

    const noteC = { _id: '3', title: 'Third note', content: 'c', createdAt: '2024-01-03T00:00:00.000Z' };
    notesService.listNotes.mockResolvedValueOnce({
      data: [noteC],
      pagination: { page: 2, limit: 50, total: 100, totalPages: 2 },
    });

    await user.click(screen.getByText('Load more'));

    expect(await screen.findByText('Third note')).toBeInTheDocument();
    // The original notes are still present — appended, not replaced.
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(notesService.listNotes).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), 'fake-token');
  });

  it('searching calls the backend with the search term (server-side, not a local filter)', async () => {
    render(<NotesPage />);
    await screen.findByText('First note');

    const { fireEvent } = await import('@testing-library/react');
    vi.useFakeTimers();
    try {
      fireEvent.change(screen.getByLabelText('Search notes'), { target: { value: 'grocery' } });
      await vi.advanceTimersByTimeAsync(400);
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() =>
      expect(notesService.listNotes).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'grocery', page: 1 }),
        'fake-token'
      )
    );
  });
});
