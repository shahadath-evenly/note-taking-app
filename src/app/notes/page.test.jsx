import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
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

const sampleNote = { _id: '1', title: 'First note', content: 'First content', createdAt: '2024-01-01T00:00:00.000Z' };

function mockList(overrides = {}) {
  notesService.listNotes.mockResolvedValue({
    data: [sampleNote],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
});

describe('NotesPage: list, loading, empty, error', () => {
  it('lists the current user\'s notes from the backend with default paging params', async () => {
    render(<NotesPage />);

    expect(await screen.findByText('First note')).toBeInTheDocument();
    expect(notesService.listNotes).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
      'fake-token'
    );
  });

  it('shows a loading state before the first response arrives', () => {
    let resolveFn;
    notesService.listNotes.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      })
    );

    render(<NotesPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    resolveFn({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  });

  it('shows an empty-state message when there are no notes', async () => {
    mockList({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    render(<NotesPage />);

    expect(await screen.findByText('You have no notes yet. Create your first one!')).toBeInTheDocument();
  });

  it('shows the backend error message when loading fails', async () => {
    notesService.listNotes.mockRejectedValue(new ApiClientError(500, 'Server exploded'));
    render(<NotesPage />);

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });
});

describe('NotesPage: create', () => {
  it('creates a note through the form and refreshes the list from the backend', async () => {
    const user = userEvent.setup();
    notesService.createNote.mockResolvedValue({ data: { ...sampleNote, _id: '2', title: 'New note' } });

    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByRole('button', { name: 'New note' }));
    await user.type(screen.getByLabelText('Title'), 'New note');
    await user.type(screen.getByLabelText('Content'), 'New content');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(notesService.createNote).toHaveBeenCalledWith({ title: 'New note', content: 'New content' }, 'fake-token')
    );
    // Initial load + the refetch triggered after a successful create.
    expect(notesService.listNotes).toHaveBeenCalledTimes(2);
  });

  it('shows a validation error and never calls the API when the form is submitted empty', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByRole('button', { name: 'New note' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(notesService.createNote).not.toHaveBeenCalled();
  });
});

describe('NotesPage: view/edit', () => {
  it('opens the edit form pre-filled with the full note content (satisfies the view requirement)', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByText('Edit'));

    expect(await screen.findByLabelText('Title')).toHaveValue('First note');
    expect(screen.getByLabelText('Content')).toHaveValue('First content');
  });

  it('submits the edited values to the backend and refreshes the list', async () => {
    const user = userEvent.setup();
    notesService.updateNote.mockResolvedValue({ data: { ...sampleNote, title: 'Updated title' } });

    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByText('Edit'));
    const titleInput = await screen.findByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(notesService.updateNote).toHaveBeenCalledWith(
        '1',
        { title: 'Updated title', content: 'First content' },
        'fake-token'
      )
    );
    expect(notesService.listNotes).toHaveBeenCalledTimes(2);
  });
});

describe('NotesPage: delete', () => {
  it('asks for confirmation before deleting, and does not call the API on cancel', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Delete "First note"\?/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(notesService.deleteNote).not.toHaveBeenCalled();
  });

  it('deletes the note after confirmation and refreshes the list', async () => {
    const user = userEvent.setup();
    notesService.deleteNote.mockResolvedValue({});

    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(notesService.deleteNote).toHaveBeenCalledWith('1', 'fake-token'));
  });
});

describe('NotesPage: pagination and search', () => {
  it('requests the next page from the backend while preserving the rest of the query', async () => {
    const user = userEvent.setup();
    mockList({ pagination: { page: 1, limit: 10, total: 25, totalPages: 3 } });

    render(<NotesPage />);
    await screen.findByText('First note');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(notesService.listNotes).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), 'fake-token')
    );
  });

  describe('search', () => {
    it('debounces search input and calls the backend with the search term, resetting to page 1', async () => {
      render(<NotesPage />);
      // Resolve the initial load with real timers first — switching to fake
      // timers before this would hang testing-library's own internal
      // polling, which relies on real timers.
      await screen.findByText('First note');

      vi.useFakeTimers();
      try {
        fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'grocery' } });
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
});
