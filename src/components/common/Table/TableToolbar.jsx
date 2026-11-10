import TableSearch from './TableSearch';
import TableFilters from './TableFilters';

export default function TableToolbar({ query, onSearch, filters, onFilterChange, onResetFilters }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800">
      <div className="order-1">
        <TableSearch value={query.search} onSearch={onSearch} />
      </div>
      <div className="order-2 ml-auto">
        <TableFilters filters={filters} query={query} onFilterChange={onFilterChange} onReset={onResetFilters} />
      </div>
    </div>
  );
}
