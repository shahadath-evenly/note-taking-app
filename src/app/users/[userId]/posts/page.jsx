import { Suspense } from 'react';
import Spinner from '@/components/common/Spinner';
import UserPostsView from './UserPostsView';

// This route reads the dynamic `userId` segment at request time (no
// `generateStaticParams`), and the shared `Navbar` reads the current
// pathname — both only resolve once the URL is known, so this segment
// can't produce a static shell. `instant = false` (a Server Component
// export, hence this thin wrapper around the actual client view) opts
// the route out of that validation instead of forcing it to prerender.
export const instant = false;

export default function UserPostsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner className="text-primary" />
        </div>
      }
    >
      <UserPostsView />
    </Suspense>
  );
}
