'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/lib/ApiClientError';
import * as notesService from '@/services/notes/notes.service';

const PAGE_LIMIT = 50;
const DRAFT_NOTE = Object.freeze({ title: '', content: '' });
const DEFAULT_PAGINATION = { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 0 };

function NotesPageContent() {
  const { token } = useAuth();

  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  // Bumped on every "New note" click so NoteEditor's `key` always changes
  // even if the previous draft was never saved — otherwise clicking "New
  // note" again while already drafting would reuse the same 'draft' key,
  // NoteEditor wouldn't remount, and the stale unsaved title/content would
  // stick around instead of resetting to blank.
  const [draftVersion, setDraftVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Guards against an older, slower request overwriting a newer one's
  // result (e.g. a fast search edit right after a slow one).
  const latestRequestId = useRef(0);

  const fetchFirstPage = useCallback(
    async (currentSearch) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      setLoading(true);
      setLoadError(null);
      try {
        const response = await notesService.listNotes(
          { page: 1, limit: PAGE_LIMIT, search: currentSearch, sortBy: 'createdAt', sortOrder: 'desc' },
          token
        );
        if (latestRequestId.current !== requestId) {
          return;
        }
        setNotes(response.data);
        setPagination(response.pagination);
      } catch (error) {
        if (latestRequestId.current !== requestId) {
          return;
        }
        setLoadError(error instanceof ApiClientError ? error.message : 'Failed to load notes.');
      } finally {
        if (latestRequestId.current === requestId) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    async function run() {
      await fetchFirstPage(search);
    }
    run();
  }, [search, fetchFirstPage]);

  async function handleLoadMore() {
    setIsLoadingMore(true);
    setLoadError(null);
    try {
      const nextPage = pagination.page + 1;
      const response = await notesService.listNotes(
        { page: nextPage, limit: PAGE_LIMIT, search, sortBy: 'createdAt', sortOrder: 'desc' },
        token
      );
      setNotes((prev) => [...prev, ...response.data]);
      setPagination(response.pagination);
    } catch (error) {
      setLoadError(error instanceof ApiClientError ? error.message : 'Failed to load more notes.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleSelect(note) {
    setIsCreatingDraft(false);
    setSelectedId(note._id);
  }

  function handleCreateDraft() {
    setIsCreatingDraft(true);
    setSelectedId(null);
    setDraftVersion((version) => version + 1);
  }

  async function handleSaveDraft(values) {
    setIsSaving(true);
    try {
      const response = await notesService.createNote(values, token);
      setNotes((prev) => [response.data, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      setIsCreatingDraft(false);
      setSelectedId(response.data._id);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateNote(values) {
    setIsSaving(true);
    try {
      const response = await notesService.updateNote(selectedId, values, token);
      setNotes((prev) => prev.map((note) => (note._id === selectedId ? response.data : note)));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await notesService.deleteNote(noteToDelete._id, token);
      setNotes((prev) => prev.filter((note) => note._id !== noteToDelete._id));
      setPagination((prev) => ({ ...prev, total: Math.max(prev.total - 1, 0) }));
      if (selectedId === noteToDelete._id) {
        setSelectedId(null);
      }
      setNoteToDelete(null);
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : 'Failed to delete the note.');
    } finally {
      setIsDeleting(false);
    }
  }

  const selectedNote = isCreatingDraft ? DRAFT_NOTE : notes.find((note) => note._id === selectedId) || null;

  return (
    <div className="flex h-full overflow-hidden">
      <NotesList
        notes={notes}
        selectedId={isCreatingDraft ? null : selectedId}
        onSelect={handleSelect}
        onCreateDraft={handleCreateDraft}
        search={search}
        onSearch={setSearch}
        loading={loading}
        error={loadError}
        hasMore={pagination.page < pagination.totalPages}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
      />

      <div className="w-4/5">
        <NoteEditor
          key={isCreatingDraft ? `draft-${draftVersion}` : selectedId || 'none'}
          note={selectedNote}
          isDraft={isCreatingDraft}
          onSave={isCreatingDraft ? handleSaveDraft : handleUpdateNote}
          onDelete={setNoteToDelete}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      </div>

      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        title="Delete note"
        message={`Delete "${noteToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
        isConfirming={isDeleting}
        error={deleteError}
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <RequireAuth>
      <NotesPageContent />
    </RequireAuth>
  );
}
