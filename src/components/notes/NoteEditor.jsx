'use client';

import { useState } from 'react';
import { validateForm } from '@/lib/validateForm';
import { createNoteSchema } from '@/validations/notes/createNote.schema';
import { ApiClientError } from '@/lib/ApiClientError';
import Button from '@/components/forms/Button';
import ErrorMessage from '@/components/common/ErrorMessage';
import Spinner from '@/components/common/Spinner';

const TITLE_MAX_LENGTH = 150;

// Right-hand pane of the two-pane notes layout. Handles both a brand-new,
// not-yet-saved draft and an existing note, inline (no modal) — typing a
// title is what enables "Create note" for a draft; typing anything that
// differs from the saved note is what enables "Update" for an existing one.
export default function NoteEditor({ note, isDraft, onSave, onDelete, isSaving, isDeleting }) {
  const currentKey = isDraft ? 'draft' : note?._id || 'none';

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [syncedKey, setSyncedKey] = useState(currentKey);

  // Reset local editing state whenever the selected note (or draft) changes
  // — adjusted during render (React's documented pattern for "reset state
  // when a prop changes") so the previous note's text never flashes.
  if (currentKey !== syncedKey) {
    setSyncedKey(currentKey);
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setFieldErrors({});
    setFormError(null);
  }

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        Select a note, or create a new one.
      </div>
    );
  }

  const hasTitle = title.trim().length > 0;
  const isDirty = isDraft || title !== note.title || content !== note.content;
  const canSave = hasTitle && isDirty;

  async function handleSave() {
    setFormError(null);
    const { values, errors } = await validateForm(createNoteSchema, { title, content });
    setFieldErrors(errors);
    if (!values) {
      return;
    }

    try {
      await onSave(values);
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <span className="text-xs text-zinc-400">
          {title.length}/{TITLE_MAX_LENGTH}
        </span>
        <div className="flex items-center gap-4">
          {!isDraft ? (
            <button
              type="button"
              onClick={() => onDelete(note)}
              disabled={isDeleting}
              className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            >
              Delete
            </button>
          ) : null}
          <Button type="button" onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? <Spinner /> : null}
            {isDraft ? 'Create note' : 'Update'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4">
        <input
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          aria-label="Title"
          className="w-full border-none bg-transparent text-2xl font-semibold text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-50 dark:placeholder:text-zinc-700"
        />
        {fieldErrors.title ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.title}</p> : null}

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Start typing…"
          aria-label="Content"
          className="mt-3 flex-1 resize-none border-none bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-300 dark:text-zinc-300 dark:placeholder:text-zinc-700"
        />

        <ErrorMessage message={formError} />
      </div>
    </div>
  );
}
