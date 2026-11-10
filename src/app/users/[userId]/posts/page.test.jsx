import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPostsPage from './page';
import * as postsService from '@/services/posts/posts.service';
import { ApiClientError } from '@/lib/ApiClientError';

vi.mock('next/navigation', () => ({
  useParams: () => ({ userId: 'u1' }),
}));

vi.mock('@/services/posts/posts.service');

const theUser = { _id: 'u1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', role: 'user' };
const postA = { _id: '1', title: 'First post', content: 'Hello world', createdAt: '2024-01-01T00:00:00.000Z' };
const postB = { _id: '2', title: 'Second post', content: 'Another post', createdAt: '2024-01-02T00:00:00.000Z' };

function mockUserPosts(overrides = {}) {
  postsService.getUserPosts.mockResolvedValue({
    data: { user: theUser, posts: [postA, postB] },
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUserPosts();
});

describe('UserPostsPage: aggregation integration', () => {
  it('fetches the user and their posts with a single call to the aggregation endpoint', async () => {
    render(<UserPostsPage />);

    expect(await screen.findByText("Ada Lovelace's Posts")).toBeInTheDocument();
    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(screen.getByText('Second post')).toBeInTheDocument();
    expect(postsService.getUserPosts).toHaveBeenCalledTimes(1);
    expect(postsService.getUserPosts).toHaveBeenCalledWith('u1', { page: 1, limit: 10 });
  });

  it('does not show a "View author\'s posts" link on that author\'s own posts page', async () => {
    render(<UserPostsPage />);
    await screen.findByText('First post');
    expect(screen.queryByText("View author's posts")).not.toBeInTheDocument();
  });

  it('shows the backend error message when the user does not exist', async () => {
    postsService.getUserPosts.mockRejectedValue(new ApiClientError(404, 'User not found'));
    render(<UserPostsPage />);
    expect(await screen.findByText('User not found')).toBeInTheDocument();
  });

  it('shows an empty state when the user has no posts', async () => {
    mockUserPosts({ data: { user: theUser, posts: [] }, pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    render(<UserPostsPage />);
    expect(await screen.findByText("This user hasn't posted anything yet.")).toBeInTheDocument();
  });
});

describe('UserPostsPage: pagination', () => {
  it('requests the next page using backend pagination metadata, via the same single aggregation call', async () => {
    const user = userEvent.setup();
    mockUserPosts({ pagination: { page: 1, limit: 10, total: 25, totalPages: 3 } });

    render(<UserPostsPage />);
    await screen.findByText('First post');
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(postsService.getUserPosts).toHaveBeenLastCalledWith('u1', { page: 2, limit: 10 }));
    expect(postsService.getUserPosts).toHaveBeenCalledTimes(2);
  });
});
