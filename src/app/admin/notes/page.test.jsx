import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminNotesPage from './page';
import * as notesService from '@/services/notes/notes.service';
import { ApiClientError } from '@/lib/ApiClientError';

const mockRouter = { replace: vi.fn(), push: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

let mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'admin' }, token: 'fake-token' };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('@/services/notes/notes.service');

const noteA = {
  _id: '1',
  title: 'Shopping list',
  content: 'milk, eggs',
  owner: { _id: 'u1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
  createdAt: '2024-01-01T00:00:00.000Z',
};
const noteB = {
  _id: '2',
  title: 'Orphaned note',
  content: 'owner deleted',
  owner: null,
  createdAt: '2024-01-02T00:00:00.000Z',
};

function mockList(overrides = {}) {
  notesService.listAllNotes.mockResolvedValue({
    data: [noteA, noteB],
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'admin' }, token: 'fake-token' };
  mockList();
});

describe('AdminNotesPage: access restrictions', () => {
  it('redirects to /login when the viewer is not authenticated', () => {
    mockAuth = { isAuthenticated: false, isLoading: false, user: null, token: null };
    render(<AdminNotesPage />);

    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('All Notes')).not.toBeInTheDocument();
    expect(notesService.listAllNotes).not.toHaveBeenCalled();
  });

  it('redirects a non-admin user away and never calls the admin API', () => {
    mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'user' }, token: 'fake-token' };
    render(<AdminNotesPage />);

    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(screen.queryByText('All Notes')).not.toBeInTheDocument();
    expect(notesService.listAllNotes).not.toHaveBeenCalled();
  });

  it('renders for an admin', async () => {
    render(<AdminNotesPage />);
    expect(await screen.findByText('All Notes')).toBeInTheDocument();
  });
});

describe('AdminNotesPage: listing', () => {
  it('lists notes with default paging params, including an owner column and no actions', async () => {
    render(<AdminNotesPage />);

    expect(await screen.findByText('Shopping list')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(notesService.listAllNotes).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }), 'fake-token');
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows a safe fallback for a note whose owner was deleted', async () => {
    render(<AdminNotesPage />);
    expect(await screen.findByText('Orphaned note')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('never displays sensitive owner fields such as a password hash', async () => {
    render(<AdminNotesPage />);
    await screen.findByText('Shopping list');
    expect(screen.queryByText(/\$2[aby]\$/)).not.toBeInTheDocument();
    expect(screen.queryByText('ada@example.com')).not.toBeInTheDocument();
  });

  it('shows the backend error message when loading fails', async () => {
    notesService.listAllNotes.mockRejectedValue(new ApiClientError(500, 'Server exploded'));
    render(<AdminNotesPage />);
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });

  it('shows an empty state when there are no notes', async () => {
    mockList({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    render(<AdminNotesPage />);
    expect(await screen.findByText('No notes found.')).toBeInTheDocument();
  });
});

describe('AdminNotesPage: server-driven query controls', () => {
  it('debounces search and calls the backend with the term, resetting to page 1', async () => {
    render(<AdminNotesPage />);
    await screen.findByText('Shopping list');

    vi.useFakeTimers();
    try {
      fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'shopping' } });
      await vi.advanceTimersByTimeAsync(400);
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() =>
      expect(notesService.listAllNotes).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'shopping', page: 1 }),
        'fake-token'
      )
    );
  });

  it('sorts by a column when its header is clicked', async () => {
    render(<AdminNotesPage />);
    await screen.findByText('Shopping list');

    fireEvent.click(screen.getByText('Title'));

    await waitFor(() =>
      expect(notesService.listAllNotes).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortBy: 'title', sortOrder: 'asc', page: 1 }),
        'fake-token'
      )
    );
  });

  it('requests the next page while preserving the rest of the query', async () => {
    mockList({ pagination: { page: 1, limit: 10, total: 25, totalPages: 3 } });

    render(<AdminNotesPage />);
    await screen.findByText('Shopping list');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(notesService.listAllNotes).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), 'fake-token')
    );
  });

  it('does not render any filter controls, since the backend supports none', async () => {
    render(<AdminNotesPage />);
    await screen.findByText('Shopping list');
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });
});
