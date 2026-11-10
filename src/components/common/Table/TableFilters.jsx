'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

// A minimal searchable/autocomplete dropdown — typing filters the option
// list — used instead of a plain <select> per the requirement that filter
// dropdowns must support typing, not just a flat list of options.
function FilterCombobox({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputId = useId();

  const selectedOption = options.find((option) => option.value === value) || null;

  const visibleOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectOption(optionValue) {
    onChange(optionValue);
    setIsOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={`${inputId}-listbox`}
        value={isOpen ? query : selectedOption?.label || ''}
        placeholder="All"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        className="w-40 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900"
      />
      {isOpen ? (
        <ul
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute top-full z-10 mt-1 max-h-56 w-40 overflow-auto rounded border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <li>
            <button
              type="button"
              onClick={() => selectOption('')}
              className="block w-full px-3 py-1.5 text-left text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              All
            </button>
          </li>
          {visibleOptions.length === 0 ? (
            <li className="px-3 py-1.5 text-zinc-400">No matches</li>
          ) : (
            visibleOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => selectOption(option.value)}
                  className={`block w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    option.value === value ? 'font-medium text-primary' : ''
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export default function TableFilters({ filters, query, onFilterChange, onReset }) {
  if (!filters || filters.length === 0) {
    return null;
  }

  const hasActiveFilter = filters.some((filter) => Boolean(query[filter.name]));

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((filter) => (
        <FilterCombobox
          key={filter.name}
          label={filter.label}
          value={query[filter.name] || ''}
          options={filter.options}
          onChange={(value) => onFilterChange(filter.name, value)}
        />
      ))}
      {hasActiveFilter ? (
        <button
          type="button"
          onClick={onReset}
          className="rounded px-2 py-2 text-xs font-medium text-zinc-600 underline hover:text-primary dark:text-zinc-400"
        >
          Reset filters
        </button>
      ) : null}
    </div>
  );
}
