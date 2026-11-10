import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from './Table';

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'content', label: 'Content' },
];

function Row({ row }) {
  return (
    <tr>
      <td>{row.title}</td>
      <td>{row.content}</td>
    </tr>
  );
}

const basePagination = { page: 1, limit: 10, total: 2, totalPages: 1 };
const baseQuery = { page: 1, limit: 10, search: '', sortBy: '', sortOrder: 'desc' };
const rows = [
  { _id: '1', title: 'First', content: 'A' },
  { _id: '2', title: 'Second', content: 'B' },
];

describe('Table', () => {
  it('renders rows through the provided RowComponent, not hardcoded fields', () => {
    render(
      <Table columns={columns} rows={rows} RowComponent={Row} pagination={basePagination} query={baseQuery} onQueryChange={() => {}} />
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('shows a loading state instead of rows when loading', () => {
    render(
      <Table
        columns={columns}
        rows={[]}
        RowComponent={Row}
        pagination={basePagination}
        query={baseQuery}
        onQueryChange={() => {}}
        loading
      />
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an error state with the given message', () => {
    render(
      <Table
        columns={columns}
        rows={[]}
        RowComponent={Row}
        pagination={basePagination}
        query={baseQuery}
        onQueryChange={() => {}}
        error="Could not load notes"
      />
    );

    expect(screen.getByText('Could not load notes')).toBeInTheDocument();
  });

  it('shows an empty state when there are no rows and no error/loading', () => {
    render(
      <Table
        columns={columns}
        rows={[]}
        RowComponent={Row}
        pagination={{ page: 1, limit: 10, total: 0, totalPages: 0 }}
        query={baseQuery}
        onQueryChange={() => {}}
        emptyMessage="No notes yet"
      />
    );

    expect(screen.getByText('No notes yet')).toBeInTheDocument();
  });

  it('hides the filter section entirely when no filters are passed', () => {
    render(
      <Table columns={columns} rows={rows} RowComponent={Row} pagination={basePagination} query={baseQuery} onQueryChange={() => {}} />
    );

    // Note: a plain <select> (the page-size control, always rendered) also
    // matches role "combobox" in jsdom's aria mapping, so assert on the
    // filter's own placeholder rather than the ambiguous role.
    expect(screen.queryByPlaceholderText('All')).not.toBeInTheDocument();
  });

  it('shows filters when a non-empty filter config is passed', () => {
    const filters = [{ name: 'role', label: 'Role', options: [{ value: 'admin', label: 'Admin' }] }];
    render(
      <Table
        columns={columns}
        rows={rows}
        RowComponent={Row}
        pagination={basePagination}
        query={{ ...baseQuery, role: '' }}
        onQueryChange={() => {}}
        filters={filters}
      />
    );

    expect(screen.getByPlaceholderText('All')).toBeInTheDocument();
  });

  it('clicking a sortable column header toggles sort and resets page to 1', () => {
    const onQueryChange = vi.fn();
    render(
      <Table
        columns={columns}
        rows={rows}
        RowComponent={Row}
        pagination={basePagination}
        query={{ ...baseQuery, page: 3, sortBy: 'title', sortOrder: 'asc' }}
        onQueryChange={onQueryChange}
      />
    );

    screen.getByRole('button', { name: /Title/ }).click();

    expect(onQueryChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'title', sortOrder: 'desc', page: 1 })
    );
  });

  it('clicking Next requests the next page while preserving the rest of the query', () => {
    const onQueryChange = vi.fn();
    render(
      <Table
        columns={columns}
        rows={rows}
        RowComponent={Row}
        pagination={{ page: 1, limit: 10, total: 25, totalPages: 3 }}
        query={{ ...baseQuery, search: 'abc' }}
        onQueryChange={onQueryChange}
      />
    );

    screen.getByRole('button', { name: 'Next' }).click();

    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'abc', page: 2 }));
  });

  it('Previous is disabled on page 1 and Next is disabled on the last page', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        RowComponent={Row}
        pagination={{ page: 1, limit: 10, total: 5, totalPages: 1 }}
        query={baseQuery}
        onQueryChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('changing the page size resets page to 1', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(
      <Table
        columns={columns}
        rows={rows}
        RowComponent={Row}
        pagination={{ page: 3, limit: 10, total: 50, totalPages: 5 }}
        query={{ ...baseQuery, page: 3 }}
        onQueryChange={onQueryChange}
      />
    );

    await user.selectOptions(screen.getByLabelText('Rows per page'), '20');

    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ limit: 20, page: 1 }));
  });

  it('shows the correct "Showing X-Y of Z" range', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        RowComponent={Row}
        pagination={{ page: 2, limit: 10, total: 25, totalPages: 3 }}
        query={baseQuery}
        onQueryChange={() => {}}
      />
    );

    expect(screen.getByText('Showing 11–20 of 25')).toBeInTheDocument();
  });
});

describe('Table search debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search input and resets page to 1 only after the debounce fires', async () => {
    const onQueryChange = vi.fn();

    render(
      <Table
        columns={columns}
        rows={rows}
        RowComponent={Row}
        pagination={{ ...basePagination, page: 2 }}
        query={{ ...baseQuery, page: 2 }}
        onQueryChange={onQueryChange}
      />
    );

    const searchInput = screen.getByLabelText('Search');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    expect(onQueryChange).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);

    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'hello', page: 1 }));
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });
});
