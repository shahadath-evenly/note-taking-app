'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';
import TableHead from '@/components/common/Table/TableHead';
import TableStates from '@/components/common/Table/TableStates';
import TablePagination from '@/components/common/Table/TablePagination';
import InterestGroupRow from '@/components/rows/InterestGroupRow';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/lib/ApiClientError';
import { ROLES } from '@/constants/roles';
import * as usersService from '@/services/users/users.service';

// No sortable columns: the backend endpoint only accepts `page`/`limit`
// (see groupByInterests.schema.js) and already returns groups in a fixed,
// deterministic order (alphabetical by interest). `TableHead` is reused
// standalone, without the rest of the shared `Table`, specifically to
// avoid showing a search box the backend has nothing to do with.
const COLUMNS = [
  { key: 'interest', label: 'Interest' },
  { key: 'users', label: 'Users' },
  { key: 'userCount', label: 'Count' },
];

const DEFAULT_QUERY = { page: 1, limit: 10 };
const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0 };

function AdminInterestsPageContent() {
  const { token } = useAuth();

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Guards against an older, slower request overwriting a newer one's
  // result (e.g. a fast page click right after a slow prior request).
  const latestRequestId = useRef(0);

  const fetchGroups = useCallback(
    async (currentQuery) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      setLoading(true);
      setLoadError(null);
      try {
        const response = await usersService.getUsersGroupedByInterests(currentQuery, token);
        if (latestRequestId.current !== requestId) {
          return;
        }
        setGroups(response.data);
        setPagination(response.pagination);
      } catch (error) {
        if (latestRequestId.current !== requestId) {
          return;
        }
        setLoadError(error instanceof ApiClientError ? error.message : 'Failed to load interest groups.');
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
      await fetchGroups(query);
    }
    run();
  }, [query, fetchGroups]);

  function handlePageChange(nextPage) {
    if (nextPage < 1 || (pagination.totalPages > 0 && nextPage > pagination.totalPages)) {
      return;
    }
    setQuery((prev) => ({ ...prev, page: nextPage }));
  }

  function handleLimitChange(nextLimit) {
    setQuery((prev) => ({ ...prev, limit: nextLimit, page: 1 }));
  }

  const stateStatus = loading ? 'loading' : loadError ? 'error' : groups.length === 0 ? 'empty' : null;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Grouped Interests</h1>
      </div>

      <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <TableHead columns={COLUMNS} query={{}} onSort={() => {}} />
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {stateStatus ? (
                <TableStates
                  status={stateStatus}
                  message={loadError || 'No interest groups found.'}
                  columnCount={COLUMNS.length}
                />
              ) : (
                groups.map((group) => <InterestGroupRow key={group.interest} row={group} />)
              )}
            </tbody>
          </table>
        </div>

        <TablePagination pagination={pagination} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
      </div>
    </div>
  );
}

export default function AdminInterestsPage() {
  return (
    <RequireAuth role={ROLES.ADMIN}>
      <AdminInterestsPageContent />
    </RequireAuth>
  );
}
