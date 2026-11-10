import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InterestGroupRow from './InterestGroupRow';

function renderRow(row) {
  return render(
    <table>
      <tbody>
        <InterestGroupRow row={row} />
      </tbody>
    </table>
  );
}

describe('InterestGroupRow', () => {
  it('renders the interest name, each user, and the user count', () => {
    renderRow({
      interest: 'chess',
      users: [
        { _id: '1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', role: 'user' },
        { _id: '2', firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', role: 'admin' },
      ],
      userCount: 2,
    });

    expect(screen.getByText('chess')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('(ada@example.com)')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('never renders a password field', () => {
    renderRow({
      interest: 'chess',
      users: [{ _id: '1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', role: 'user', password: '$2b$10$hash' }],
      userCount: 1,
    });

    expect(screen.queryByText(/\$2[aby]\$/)).not.toBeInTheDocument();
  });

  it('shows a fallback when a group has no users', () => {
    renderRow({ interest: 'chess', users: [], userCount: 0 });
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
