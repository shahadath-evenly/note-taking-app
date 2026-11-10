import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostsPage from './page';
import * as postsService from '@/services/posts/posts.service';
import { ApiClientError } from '@/lib/ApiClientError';

let mockAuth = { isAuthenticated: false, isLoading: false, user: null, token: null };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('@/services/posts/posts.service');

const postA = { _id: '1', title: 'First post', content: 'Hello world', userId: 'u1', createdAt: '2024-01-01T00:00:00.000Z' };
const postB = { _id: '2', title: 'Second post', content: 'Another post', userId: 'u2', createdAt: '2024-01-02T00:00:00.000Z' };

function mockList(overrides = {}) {
  postsService.listPosts.mockResolvedValue({
    data: [postA, postB],
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth = { isAuthenticated: false, isLoading: false, user: null, token: null };
  mockList();
});

describe('PostsPage: public access', () => {
  it('renders the feed for a logged-out visitor without requiring authentication', async () => {
    render(<PostsPage />);

    expect(await screen.findByText('First post')).toBeInTheDocument();
    expect(screen.getByText('Second post')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Post' })).not.toBeInTheDocument();
  });

  it('shows a loading state before the response resolves', async () => {
    let resolveRequest;
    postsService.listPosts.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<PostsPage />);
    expect(await screen.findByRole('status')).toBeInTheDocument();

    resolveRequest({ data: [postA], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('shows an empty state when there are no posts', async () => {
    mockList({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    render(<PostsPage />);
    expect(await screen.findByText('No posts yet.')).toBeInTheDocument();
  });

  it('shows the backend error message when loading fails', async () => {
    postsService.listPosts.mockRejectedValue(new ApiClientError(500, 'Server exploded'));
    render(<PostsPage />);
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });
});

describe('PostsPage: authenticated creation', () => {
  it('shows the create-post form only for an authenticated user', async () => {
    mockAuth = { isAuthenticated: true, isLoading: false, user: { firstName: 'Ada' }, token: 'fake-token' };
    render(<PostsPage />);

    await screen.findByText('First post');
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
    expect(screen.queryByText('Log in')).not.toBeInTheDocument();
  });

  it('creates a post through the form and refreshes the feed', async () => {
    mockAuth = { isAuthenticated: true, isLoading: false, user: { firstName: 'Ada' }, token: 'fake-token' };
    const user = userEvent.setup();
    postsService.createPost.mockResolvedValue({
      data: { _id: '3', title: 'New post', content: 'New content', userId: 'u1' },
    });

    render(<PostsPage />);
    await screen.findByText('First post');

    await user.type(screen.getByLabelText('Title'), 'New post');
    await user.type(screen.getByLabelText('Content'), 'New content');
    await user.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() =>
      expect(postsService.createPost).toHaveBeenCalledWith(
        { title: 'New post', content: 'New content' },
        'fake-token'
      )
    );
    await waitFor(() => expect(postsService.listPosts).toHaveBeenCalledTimes(2));
  });
});

describe('PostsPage: pagination', () => {
  it('requests the next page using backend pagination metadata', async () => {
    const user = userEvent.setup();
    mockList({ pagination: { page: 1, limit: 10, total: 25, totalPages: 3 } });

    render(<PostsPage />);
    await screen.findByText('First post');
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(postsService.listPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    );
  });

  it('does not render pagination controls when there is only one page', async () => {
    render(<PostsPage />);
    await screen.findByText('First post');
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });
});
