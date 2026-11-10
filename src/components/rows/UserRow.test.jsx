import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserRow from './UserRow';

function renderRow(row, props = {}) {
  return render(
    <table>
      <tbody>
        <UserRow row={row} {...props} />
      </tbody>
    </table>
  );
}

const baseUser = {
  _id: '1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  role: 'user',
  interests: ['chess', 'math'],
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('UserRow', () => {
  it('renders name, email, role, and interests', () => {
    renderRow(baseUser);
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('chess, math')).toBeInTheDocument();
  });

  it('never renders a password field, even if one were present in the row data', () => {
    renderRow({ ...baseUser, password: '$2b$10$shouldneverappear' });
    expect(screen.queryByText(/shouldneverappear/)).not.toBeInTheDocument();
  });

  it('shows a placeholder when there are no interests', () => {
    renderRow({ ...baseUser, interests: [] });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows no actions when neither onEdit nor onDelete is passed', () => {
    renderRow(baseUser);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEdit/onDelete with the row when their buttons are clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderRow(baseUser, { onEdit, onDelete });

    await user.click(screen.getByText('Edit'));
    await user.click(screen.getByText('Delete'));

    expect(onEdit).toHaveBeenCalledWith(baseUser);
    expect(onDelete).toHaveBeenCalledWith(baseUser);
  });
});
