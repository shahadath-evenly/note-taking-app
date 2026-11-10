'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';
import Table from '@/components/common/Table/Table';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Button from '@/components/forms/Button';
import UserRow from '@/components/rows/UserRow';
import UserForm from '@/components/users/UserForm';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/lib/ApiClientError';
import { ROLES } from '@/constants/roles';
import * as usersService from '@/services/users/users.service';

const COLUMNS = [
  { key: 'firstName', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role' },
  { key: 'interests', label: 'Interests' },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions' },
];

const FILTERS = [
  {
    name: 'role',
    label: 'Role',
    options: [
      { value: ROLES.USER, label: 'User' },
      { value: ROLES.ADMIN, label: 'Admin' },
    ],
  },
];

const DEFAULT_QUERY = { page: 1, limit: 10, search: '', sortBy: '', sortOrder: 'desc', role: '' };
const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0 };

function AdminUsersPageContent() {
  const { token } = useAuth();

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // 'create' | a user object being edited | null
  const [formTarget, setFormTarget] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Guards against an older, slower request overwriting a newer one's
  // result (e.g. a fast page click right after a slow search request).
  const latestRequestId = useRef(0);

  const fetchUsers = useCallback(
    async (currentQuery) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      setLoading(true);
      setLoadError(null);
      try {
        const response = await usersService.listUsers(currentQuery, token);
        if (latestRequestId.current !== requestId) {
          return;
        }
        setUsers(response.data);
        setPagination(response.pagination);
      } catch (error) {
        if (latestRequestId.current !== requestId) {
          return;
        }
        setLoadError(error instanceof ApiClientError ? error.message : 'Failed to load users.');
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
      await fetchUsers(query);
    }
    run();
  }, [query, fetchUsers]);

  async function handleFormSubmit(values) {
    if (formTarget === 'create') {
      await usersService.createUser(values, token);
    } else {
      await usersService.updateUser(formTarget._id, values, token);
    }
    setFormTarget(null);
    fetchUsers(query);
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await usersService.deleteUser(userToDelete._id, token);
      setUserToDelete(null);

      // If this was the only item on a page beyond the first, step back a
      // page instead of showing a now-empty page.
      if (users.length === 1 && query.page > 1) {
        setQuery((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchUsers(query);
      }
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : 'Failed to delete the user.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">User Management</h1>
        <Button onClick={() => setFormTarget('create')}>New user</Button>
      </div>

      <Table
        columns={COLUMNS}
        rows={users}
        RowComponent={UserRow}
        rowProps={{ onEdit: setFormTarget, onDelete: setUserToDelete }}
        pagination={pagination}
        query={query}
        onQueryChange={setQuery}
        filters={FILTERS}
        loading={loading}
        error={loadError}
        emptyMessage="No users found."
      />

      <Modal
        isOpen={Boolean(formTarget)}
        onClose={() => setFormTarget(null)}
        title={formTarget === 'create' ? 'New user' : 'Edit user'}
      >
        <UserForm
          key={formTarget === 'create' ? 'create' : formTarget?._id}
          initialValues={formTarget && formTarget !== 'create' ? formTarget : null}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormTarget(null)}
          submitLabel={formTarget === 'create' ? 'Create' : 'Save changes'}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        title="Delete user"
        message={`Delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
        isConfirming={isDeleting}
        error={deleteError}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <RequireAuth role={ROLES.ADMIN}>
      <AdminUsersPageContent />
    </RequireAuth>
  );
}
