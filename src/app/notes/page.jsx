'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';
import Table from '@/components/common/Table/Table';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Button from '@/components/forms/Button';
import NoteRow from '@/components/rows/NoteRow';
import NoteForm from '@/components/notes/NoteForm';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/lib/ApiClientError';
import * as notesService from '@/services/notes/notes.service';

const COLUMNS = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'content', label: 'Content' },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions' },
];

const DEFAULT_QUERY = { page: 1, limit: 10, search: '', sortBy: '', sortOrder: 'desc' };
const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0 };

function NotesPageContent() {
  const { token } = useAuth();

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // 'create' | a note object being edited | null
  const [formTarget, setFormTarget] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Guards against an older, slower request overwriting a newer one's
  // result (e.g. a fast page click right after a slow search request).
  const latestRequestId = useRef(0);

  const fetchNotes = useCallback(
    async (currentQuery) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      setLoading(true);
      setLoadError(null);
      try {
        const response = await notesService.listNotes(currentQuery, token);
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
      await fetchNotes(query);
    }
    run();
  }, [query, fetchNotes]);

  async function handleFormSubmit(values) {
    if (formTarget === 'create') {
      await notesService.createNote(values, token);
    } else {
      await notesService.updateNote(formTarget._id, values, token);
    }
    setFormTarget(null);
    fetchNotes(query);
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await notesService.deleteNote(noteToDelete._id, token);
      setNoteToDelete(null);

      // If this was the only item on a page beyond the first, step back a
      // page instead of showing an now-empty page.
      if (notes.length === 1 && query.page > 1) {
        setQuery((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchNotes(query);
      }
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : 'Failed to delete the note.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Notes</h1>
        <Button onClick={() => setFormTarget('create')}>New note</Button>
      </div>

      <Table
        columns={COLUMNS}
        rows={notes}
        RowComponent={NoteRow}
        rowProps={{ onEdit: setFormTarget, onDelete: setNoteToDelete }}
        pagination={pagination}
        query={query}
        onQueryChange={setQuery}
        loading={loading}
        error={loadError}
        emptyMessage="You have no notes yet. Create your first one!"
      />

      <Modal
        isOpen={Boolean(formTarget)}
        onClose={() => setFormTarget(null)}
        title={formTarget === 'create' ? 'New note' : 'Edit note'}
      >
        <NoteForm
          key={formTarget === 'create' ? 'create' : formTarget?._id}
          initialValues={formTarget && formTarget !== 'create' ? formTarget : null}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormTarget(null)}
          submitLabel={formTarget === 'create' ? 'Create' : 'Save changes'}
        />
      </Modal>

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
