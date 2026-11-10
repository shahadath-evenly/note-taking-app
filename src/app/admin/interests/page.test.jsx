import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminInterestsPage from './page';
import * as usersService from '@/services/users/users.service';
import { ApiClientError } from '@/lib/ApiClientError';

const mockRouter = { replace: vi.fn(), push: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

let mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'admin' }, token: 'fake-token' };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('@/services/users/users.service');

const chessGroup = {
  interest: 'chess',
  users: [{ _id: '1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', role: 'user' }],
  userCount: 1,
};
const hikingGroup = {
  interest: 'hiking',
  users: [{ _id: '2', firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', role: 'admin' }],
  userCount: 1,
};

function mockGroups(overrides = {}) {
  usersService.getUsersGroupedByInterests.mockResolvedValue({
    data: [chessGroup, hikingGroup],
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'admin' }, token: 'fake-token' };
  mockGroups();
});

describe('AdminInterestsPage: access restrictions', () => {
  it('redirects to /login when the viewer is not authenticated', () => {
    mockAuth = { isAuthenticated: false, isLoading: false, user: null, token: null };
    render(<AdminInterestsPage />);

    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Grouped Interests')).not.toBeInTheDocument();
    expect(usersService.getUsersGroupedByInterests).not.toHaveBeenCalled();
  });

  it('redirects a non-admin user away and never calls the admin API', () => {
    mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'user' }, token: 'fake-token' };
    render(<AdminInterestsPage />);

    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(screen.queryByText('Grouped Interests')).not.toBeInTheDocument();
    expect(usersService.getUsersGroupedByInterests).not.toHaveBeenCalled();
  });

  it('renders for an admin', async () => {
    render(<AdminInterestsPage />);
    expect(await screen.findByText('Grouped Interests')).toBeInTheDocument();
  });
});

describe('AdminInterestsPage: loading', () => {
  it('shows a loading state before the response resolves', async () => {
    let resolveRequest;
    usersService.getUsersGroupedByInterests.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<AdminInterestsPage />);
    expect(await screen.findByText('Loading…')).toBeInTheDocument();

    resolveRequest({ data: [chessGroup], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  });
});

describe('AdminInterestsPage: rendering the backend response', () => {
  it('renders each group with its interest name, users, and count, preserving the backend shape', async () => {
    render(<AdminInterestsPage />);

    expect(await screen.findByText('chess')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('hiking')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(usersService.getUsersGroupedByInterests).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
      'fake-token'
    );
  });

  it('never displays a password hash', async () => {
    render(<AdminInterestsPage />);
    await screen.findByText('chess');
    expect(screen.queryByText(/\$2[aby]\$/)).not.toBeInTheDocument();
  });

  it('shows the backend error message when loading fails', async () => {
    usersService.getUsersGroupedByInterests.mockRejectedValue(new ApiClientError(500, 'Server exploded'));
    render(<AdminInterestsPage />);
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });

  it('does not render a search box, since the backend endpoint does not support one', async () => {
    render(<AdminInterestsPage />);
    await screen.findByText('chess');
    expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
  });
});

describe('AdminInterestsPage: empty groups', () => {
  it('shows an empty state when there are no interest groups', async () => {
    mockGroups({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    render(<AdminInterestsPage />);
    expect(await screen.findByText('No interest groups found.')).toBeInTheDocument();
  });
});

describe('AdminInterestsPage: pagination', () => {
  it('requests the next page using backend pagination metadata, without recomputing counts locally', async () => {
    const user = userEvent.setup();
    mockGroups({ pagination: { page: 1, limit: 10, total: 25, totalPages: 3 } });

    render(<AdminInterestsPage />);
    await screen.findByText('chess');
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(usersService.getUsersGroupedByInterests).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
        'fake-token'
      )
    );
  });

  it('disables Previous on the first page and Next on the last page', async () => {
    mockGroups({ pagination: { page: 1, limit: 10, total: 5, totalPages: 1 } });
    render(<AdminInterestsPage />);
    await screen.findByText('chess');

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
