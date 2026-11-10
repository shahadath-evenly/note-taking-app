'use client';

import TableToolbar from './TableToolbar';
import TableHead from './TableHead';
import TablePagination from './TablePagination';
import TableStates from './TableStates';

const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0 };

// The shared, server-driven table. It owns rendering, search/filter/sort
// controls, loading/error/empty states, and pagination — it never fetches
// data or slices rows itself. Every control change is translated into a
// complete next query object and handed to `onQueryChange`; the calling
// page owns actually requesting the backend with it (see each page's data
// hook once built) and is responsible for not letting a stale response
// overwrite a newer one (AbortController / request sequencing).
export default function Table({
  columns,
  rows = [],
  RowComponent,
  rowProps = {},
  pagination = DEFAULT_PAGINATION,
  query = {},
  onQueryChange,
  filters,
  loading = false,
  error = null,
  emptyMessage,
}) {
  function handleSearch(search) {
    onQueryChange({ ...query, search, page: 1 });
  }

  function handleFilterChange(name, value) {
    onQueryChange({ ...query, [name]: value, page: 1 });
  }

  function handleResetFilters() {
    const next = { ...query, page: 1 };
    (filters || []).forEach((filter) => {
      next[filter.name] = '';
    });
    onQueryChange(next);
  }

  function handleSort(columnKey) {
    const isSameColumn = query.sortBy === columnKey;
    const nextOrder = isSameColumn && query.sortOrder === 'asc' ? 'desc' : 'asc';
    onQueryChange({ ...query, sortBy: columnKey, sortOrder: nextOrder, page: 1 });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || (pagination.totalPages > 0 && nextPage > pagination.totalPages)) {
      return;
    }
    onQueryChange({ ...query, page: nextPage });
  }

  function handleLimitChange(nextLimit) {
    onQueryChange({ ...query, limit: nextLimit, page: 1 });
  }

  const stateStatus = loading ? 'loading' : error ? 'error' : rows.length === 0 ? 'empty' : null;

  return (
    <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
      <TableToolbar
        query={query}
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <TableHead columns={columns} query={query} onSort={handleSort} />
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {stateStatus ? (
              <TableStates status={stateStatus} message={error || emptyMessage} columnCount={columns.length} />
            ) : (
              rows.map((row) => <RowComponent key={row._id || row.id} row={row} {...rowProps} />)
            )}
          </tbody>
        </table>
      </div>

      <TablePagination pagination={pagination} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
    </div>
  );
}
