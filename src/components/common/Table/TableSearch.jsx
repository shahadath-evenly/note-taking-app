'use client';

import { useEffect, useState } from 'react';

const DEBOUNCE_MS = 400;

// Owns its own draft state so typing feels instant, but only calls
// onSearch (which triggers a server request) after the user pauses —
// debounced here so every page using Table gets this for free.
export default function TableSearch({ value, onSearch, placeholder = 'Search…' }) {
  const [draft, setDraft] = useState(value || '');
  const [syncedValue, setSyncedValue] = useState(value || '');

  // Adjust state during render (React's recommended pattern for "reset
  // local state when a prop changes") instead of an effect, so an external
  // reset of `value` (e.g. clearing filters) is reflected without an extra
  // render pass.
  if ((value || '') !== syncedValue) {
    setSyncedValue(value || '');
    setDraft(value || '');
  }

  useEffect(() => {
    if (draft === (value || '')) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onSearch(draft);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <input
      type="search"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      placeholder={placeholder}
      aria-label="Search"
      className="w-full max-w-xs rounded border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900"
    />
  );
}
