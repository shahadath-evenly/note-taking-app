import RequireAuth from '@/components/auth/RequireAuth';
import { ROLES } from '@/constants/roles';

export default function AdminUsersPage() {
  return (
    <RequireAuth role={ROLES.ADMIN}>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Admin user management will appear here.</p>
      </div>
    </RequireAuth>
  );
}
