const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function TablePagination({ pagination, onPageChange, onLimitChange }) {
  const { page, limit, total, totalPages } = pagination;

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-3 py-3 text-sm dark:border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
        <span>
          Showing {rangeStart}–{rangeEnd} of {total}
        </span>
        <label className="flex items-center gap-1">
          <span className="sr-only">Rows per page</span>
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-zinc-600 dark:text-zinc-400">
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded border border-zinc-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded border border-zinc-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
