'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/forms/Button';
import { ROLES } from '@/constants/roles';

const USER_LINKS = [
  { href: '/notes', label: 'My Notes' },
  { href: '/posts', label: 'Public Posts' },
];

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'User Management' },
  { href: '/admin/notes', label: 'All Notes' },
  { href: '/admin/interests', label: 'Grouped Interests' },
  { href: '/posts', label: 'Public Posts' },
];

const GUEST_LINKS = [{ href: '/posts', label: 'Public Posts' }];

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();

  // No explicit navigation here: on a page guarded by RequireAuth, losing
  // auth already triggers its own redirect to /login (the same path an
  // expired/invalid token takes); on a public page, staying put with the
  // logged-out nav is the correct outcome. Navigating here too would race
  // RequireAuth's redirect and produce an unpredictable destination.
  function handleLogout() {
    logout();
  }

  const links = !isAuthenticated ? GUEST_LINKS : user?.role === ROLES.ADMIN ? ADMIN_LINKS : USER_LINKS;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="font-semibold text-primary">
            Secure Notes
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? 'font-medium text-primary'
                    : 'text-zinc-600 hover:text-primary dark:text-zinc-400'
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {isLoading ? null : isAuthenticated ? (
            <>
              <span className="text-zinc-600 dark:text-zinc-400">{user?.firstName}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-700 hover:text-primary dark:text-zinc-300">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
