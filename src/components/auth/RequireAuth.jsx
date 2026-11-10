'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner';

// Frontend-only UX guard: it redirects before rendering protected content so
// the user isn't shown a flash of a page they can't use. It is NOT a
// security boundary — every protected backend endpoint independently
// enforces its own JWT/role checks and remains authoritative regardless of
// what this component does.
export default function RequireAuth({ children, role }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const isRoleMismatch = Boolean(role) && user?.role !== role;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isRoleMismatch) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, isRoleMismatch, router]);

  if (isLoading || !isAuthenticated || isRoleMismatch) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return children;
}
