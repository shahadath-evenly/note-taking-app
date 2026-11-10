import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteRow from './NoteRow';

function renderRow(row, props = {}) {
  return render(
    <table>
      <tbody>
        <NoteRow row={row} {...props} />
      </tbody>
    </table>
  );
}

describe('NoteRow', () => {
  it('renders title and content', () => {
    renderRow({ _id: '1', title: 'Shopping list', content: 'milk, eggs' });
    expect(screen.getByText('Shopping list')).toBeInTheDocument();
    expect(screen.getByText('milk, eggs')).toBeInTheDocument();
  });

  it('does not show an owner column when the row has no owner', () => {
    renderRow({ _id: '1', title: 'T', content: 'C' });
    expect(screen.queryByText(/owner/i)).not.toBeInTheDocument();
  });

  it('shows an owner column only when the row includes one (admin all-notes shape)', () => {
    renderRow({ _id: '1', title: 'T', content: 'C', owner: { firstName: 'Ada', lastName: 'Lovelace' } });
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('shows no actions when neither onEdit nor onDelete is passed', () => {
    renderRow({ _id: '1', title: 'T', content: 'C' });
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEdit/onDelete with the row when their buttons are clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const row = { _id: '1', title: 'T', content: 'C' };
    renderRow(row, { onEdit, onDelete });

    await user.click(screen.getByText('Edit'));
    await user.click(screen.getByText('Delete'));

    expect(onEdit).toHaveBeenCalledWith(row);
    expect(onDelete).toHaveBeenCalledWith(row);
  });
});
