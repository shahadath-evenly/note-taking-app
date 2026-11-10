import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostCard from './PostCard';

const SHORT_CONTENT = 'A short post.';
const LONG_CONTENT = 'x'.repeat(250);

describe('PostCard', () => {
  it('renders the title and full content when content is 200 characters or fewer', () => {
    render(<PostCard post={{ _id: '1', title: 'Hello', content: SHORT_CONTENT }} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(SHORT_CONTENT)).toBeInTheDocument();
    expect(screen.queryByText('See more')).not.toBeInTheDocument();
  });

  it('truncates content over 200 characters and shows a "See more" toggle', () => {
    render(<PostCard post={{ _id: '1', title: 'Hello', content: LONG_CONTENT }} />);

    expect(screen.getByText('See more')).toBeInTheDocument();
    expect(screen.queryByText(LONG_CONTENT)).not.toBeInTheDocument();
    expect(screen.getByText(LONG_CONTENT.slice(0, 200), { exact: false })).toBeInTheDocument();
  });

  it('expands to the full content on "See more" and collapses back on "See less"', async () => {
    const user = userEvent.setup();
    render(<PostCard post={{ _id: '1', title: 'Hello', content: LONG_CONTENT }} />);

    await user.click(screen.getByText('See more'));
    expect(screen.getByText(LONG_CONTENT)).toBeInTheDocument();
    expect(screen.getByText('See less')).toBeInTheDocument();

    await user.click(screen.getByText('See less'));
    expect(screen.queryByText(LONG_CONTENT)).not.toBeInTheDocument();
    expect(screen.getByText('See more')).toBeInTheDocument();
  });

  it('links to the author\'s posts page using the post\'s userId by default', () => {
    render(<PostCard post={{ _id: '1', title: 'Hello', content: SHORT_CONTENT, userId: 'abc123' }} />);

    const link = screen.getByText("View author's posts");
    expect(link.closest('a')).toHaveAttribute('href', '/users/abc123/posts');
  });

  it('omits the author link when linkToAuthor is false (e.g. on that author\'s own posts page)', () => {
    render(
      <PostCard post={{ _id: '1', title: 'Hello', content: SHORT_CONTENT, userId: 'abc123' }} linkToAuthor={false} />
    );

    expect(screen.queryByText("View author's posts")).not.toBeInTheDocument();
  });
});
