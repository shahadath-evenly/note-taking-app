'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/forms/Button';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-primary">
          Secure Notes
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {isLoading ? null : isAuthenticated ? (
            <>
              <span className="text-zinc-600 dark:text-zinc-400">{user?.firstName}</span>
              <Button variant="secondary" onClick={logout}>
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
