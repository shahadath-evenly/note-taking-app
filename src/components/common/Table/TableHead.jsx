export default function TableHead({ columns, query, onSort }) {
  return (
    <thead className="bg-zinc-50 dark:bg-zinc-900">
      <tr>
        {columns.map((column) => {
          const isSorted = query.sortBy === column.key;
          const indicator = isSorted ? (query.sortOrder === 'asc' ? '▲' : '▼') : null;

          return (
            <th
              key={column.key}
              scope="col"
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
            >
              {column.sortable ? (
                <button
                  type="button"
                  onClick={() => onSort(column.key)}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  {column.label}
                  {indicator ? <span aria-hidden="true">{indicator}</span> : null}
                </button>
              ) : (
                column.label
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
