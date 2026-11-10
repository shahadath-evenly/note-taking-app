'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/forms/Button';
import Spinner from '@/components/common/Spinner';

const DEBOUNCE_MS = 400;

function snippetFor(note) {
  const text = (note.content || '').trim();
  return text ? text.slice(0, 80) : 'No additional text';
}

export default function NotesList({
  notes,
  selectedId,
  onSelect,
  onCreateDraft,
  search,
  onSearch,
  loading,
  error,
  hasMore,
  onLoadMore,
  isLoadingMore,
}) {
  const [draft, setDraft] = useState(search || '');
  const [syncedSearch, setSyncedSearch] = useState(search || '');

  if ((search || '') !== syncedSearch) {
    setSyncedSearch(search || '');
    setDraft(search || '');
  }

  useEffect(() => {
    if (draft === (search || '')) {
      return undefined;
    }
    const timer = setTimeout(() => onSearch(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <aside className="flex h-full w-1/5 flex-col border-r border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search"
          aria-label="Search notes"
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
        <Button type="button" onClick={onCreateDraft} className="w-full">
          New note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
            <Spinner /> Loading…
          </div>
        ) : error ? (
          <p className="px-3 py-10 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : notes.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-zinc-400">No notes found.</p>
        ) : (
          <ul>
            {notes.map((note) => (
              <li key={note._id}>
                <button
                  type="button"
                  onClick={() => onSelect(note)}
                  aria-current={selectedId === note._id}
                  className={`block w-full border-b border-zinc-100 px-3 py-2.5 text-left dark:border-zinc-900 ${
                    selectedId === note._id ? 'bg-primary/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{note.title}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-500">
                    {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''} · {snippetFor(note)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasMore ? (
          <div className="p-3">
            <Button type="button" variant="secondary" onClick={onLoadMore} disabled={isLoadingMore} className="w-full">
              {isLoadingMore ? <Spinner /> : null}
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
