import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

let mockAuth = { isAuthenticated: false, isLoading: false, user: null };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

beforeEach(() => {
  mockAuth = { isAuthenticated: false, isLoading: false, user: null };
});

describe('Home page', () => {
  it('shows sign-up/log-in calls to action for a logged-out visitor', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: "Get started — it's free" })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Browse public posts →' })).toHaveAttribute('href', '/posts');
  });

  it('shows a link to My Notes for an authenticated normal user, not User Management', () => {
    mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'user' } };
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Go to My Notes' })).toHaveAttribute('href', '/notes');
    expect(screen.queryByRole('link', { name: 'Go to User Management' })).not.toBeInTheDocument();
  });

  it('shows a link to User Management for an authenticated admin', () => {
    mockAuth = { isAuthenticated: true, isLoading: false, user: { role: 'admin' } };
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Go to User Management' })).toHaveAttribute('href', '/admin/users');
  });

  it('renders the feature highlights and how-it-works steps', () => {
    render(<Home />);

    expect(screen.getByText('Secure by design')).toBeInTheDocument();
    expect(screen.getByText('Notes that are just yours')).toBeInTheDocument();
    expect(screen.getByText('Share with everyone')).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
  });
});
