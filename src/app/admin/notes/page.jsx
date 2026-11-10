'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';
import Table from '@/components/common/Table/Table';
import NoteRow from '@/components/rows/NoteRow';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/lib/ApiClientError';
import { ROLES } from '@/constants/roles';
import * as notesService from '@/services/notes/notes.service';

const COLUMNS = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'content', label: 'Content' },
  { key: 'owner', label: 'Owner' },
  { key: 'createdAt', label: 'Created', sortable: true },
];

const DEFAULT_QUERY = { page: 1, limit: 10, search: '', sortBy: '', sortOrder: 'desc' };
const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0 };

function AdminNotesPageContent() {
  const { token } = useAuth();

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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
        const response = await notesService.listAllNotes(currentQuery, token);
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

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">All Notes</h1>
      </div>

      <Table
        columns={COLUMNS}
        rows={notes}
        RowComponent={NoteRow}
        pagination={pagination}
        query={query}
        onQueryChange={setQuery}
        loading={loading}
        error={loadError}
        emptyMessage="No notes found."
      />
    </div>
  );
}

export default function AdminNotesPage() {
  return (
    <RequireAuth role={ROLES.ADMIN}>
      <AdminNotesPageContent />
    </RequireAuth>
  );
}
