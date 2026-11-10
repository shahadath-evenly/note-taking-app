import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUsersPage from './page';
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

const userA = {
  _id: '1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  role: 'user',
  interests: [],
  createdAt: '2024-01-01T00:00:00.000Z',
};
const userB = {
  _id: '2',
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace@example.com',
  role: 'admin',
  interests: [],
  createdAt: '2024-01-02T00:00:00.000Z',
};

function mockList(overrides = {}) {
  usersService.listUsers.mockResolvedValue({
    data: [userA, userB],
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'admin' }, token: 'fake-token' };
  mockList();
});

describe('AdminUsersPage: access restrictions', () => {
  it('redirects to /login when the viewer is not authenticated', () => {
    mockAuth = { isAuthenticated: false, isLoading: false, user: null, token: null };
    render(<AdminUsersPage />);

    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(usersService.listUsers).not.toHaveBeenCalled();
  });

  it('redirects a non-admin user away and never calls the admin API', () => {
    mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'user' }, token: 'fake-token' };
    render(<AdminUsersPage />);

    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(usersService.listUsers).not.toHaveBeenCalled();
  });

  it('renders for an admin', async () => {
    render(<AdminUsersPage />);
    expect(await screen.findByText('User Management')).toBeInTheDocument();
  });
});

describe('AdminUsersPage: listing', () => {
  it('lists users with default paging params and never shows a password field', async () => {
    render(<AdminUsersPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(usersService.listUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }), 'fake-token');
    expect(screen.queryByText(/\$2b\$/)).not.toBeInTheDocument();
  });

  it('shows the backend error message when loading fails', async () => {
    usersService.listUsers.mockRejectedValue(new ApiClientError(500, 'Server exploded'));
    render(<AdminUsersPage />);
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });

  it('shows an empty state when there are no users', async () => {
    mockList({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    render(<AdminUsersPage />);
    expect(await screen.findByText('No users found.')).toBeInTheDocument();
  });
});

describe('AdminUsersPage: create', () => {
  it('creates a user through the form and refreshes the list', async () => {
    const user = userEvent.setup();
    usersService.createUser.mockResolvedValue({
      data: { _id: '3', firstName: 'New', lastName: 'User', email: 'new@example.com', role: 'user', interests: [] },
    });

    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    await user.click(screen.getByRole('button', { name: 'New user' }));
    await user.type(screen.getByLabelText('First name'), 'New');
    await user.type(screen.getByLabelText('Last name'), 'User');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'Sup3rSecret!');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'New', lastName: 'User', email: 'new@example.com' }),
        'fake-token'
      )
    );
    expect(usersService.listUsers).toHaveBeenCalledTimes(2);
  });
});

describe('AdminUsersPage: update', () => {
  it('edits a user and refreshes the list', async () => {
    const user = userEvent.setup();
    usersService.updateUser.mockResolvedValue({ data: { ...userA, role: 'admin' } });

    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    const row = screen.getByText('Ada Lovelace').closest('tr');
    await user.click(within(row).getByText('Edit'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('First name')).toHaveValue('Ada');
    await user.selectOptions(within(dialog).getByLabelText('Role'), 'admin');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(usersService.updateUser).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ role: 'admin' }),
        'fake-token'
      )
    );
    expect(usersService.listUsers).toHaveBeenCalledTimes(2);
  });
});

describe('AdminUsersPage: delete', () => {
  it('asks for confirmation and does not call the API on cancel', async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    const row = screen.getByText('Ada Lovelace').closest('tr');
    await user.click(within(row).getByText('Delete'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Delete Ada Lovelace\?/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(usersService.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes after confirmation and shows the backend error if it fails (e.g. last-admin guard)', async () => {
    const user = userEvent.setup();
    usersService.deleteUser.mockRejectedValue(new ApiClientError(409, 'Cannot delete the last remaining admin'));

    render(<AdminUsersPage />);
    await screen.findByText('Grace Hopper');

    const row = screen.getByText('Grace Hopper').closest('tr');
    await user.click(within(row).getByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByText('Cannot delete the last remaining admin')).toBeInTheDocument();
  });

  it('deletes successfully after confirmation', async () => {
    const user = userEvent.setup();
    usersService.deleteUser.mockResolvedValue({});

    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    const row = screen.getByText('Ada Lovelace').closest('tr');
    await user.click(within(row).getByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(usersService.deleteUser).toHaveBeenCalledWith('1', 'fake-token'));
  });
});

describe('AdminUsersPage: search, role filter, pagination', () => {
  it('debounces search and calls the backend with the term, resetting to page 1', async () => {
    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    vi.useFakeTimers();
    try {
      fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'ada' } });
      await vi.advanceTimersByTimeAsync(400);
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() =>
      expect(usersService.listUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'ada', page: 1 }),
        'fake-token'
      )
    );
  });

  it('filtering by role calls the backend with the role and resets to page 1', async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    await user.click(screen.getByLabelText('Role'));
    await user.click(screen.getByText('Admin'));

    await waitFor(() =>
      expect(usersService.listUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: 'admin', page: 1 }),
        'fake-token'
      )
    );
  });

  it('role filter uses a searchable/typeable combobox, not a plain dropdown', async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    const roleCombobox = screen.getByLabelText('Role');
    await user.click(roleCombobox);
    await user.type(roleCombobox, 'Adm');

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByText('User')).not.toBeInTheDocument();
  });

  it('requests the next page while preserving the rest of the query', async () => {
    const user = userEvent.setup();
    mockList({ pagination: { page: 1, limit: 10, total: 25, totalPages: 3 } });

    render(<AdminUsersPage />);
    await screen.findByText('Ada Lovelace');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(usersService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), 'fake-token')
    );
  });
});
