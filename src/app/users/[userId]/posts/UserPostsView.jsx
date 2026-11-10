'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ApiClientError } from '@/lib/ApiClientError';
import * as postsService from '@/services/posts/posts.service';
import PostCard from '@/components/posts/PostCard';
import Spinner from '@/components/common/Spinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/forms/Button';

const LIMIT = 10;
const DEFAULT_PAGINATION = { page: 1, limit: LIMIT, total: 0, totalPages: 0 };

export default function UserPostsView() {
  const { userId } = useParams();

  const [page, setPage] = useState(1);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Guards against an older, slower request overwriting a newer one's
  // result (e.g. a fast page click right after a slow prior request).
  const latestRequestId = useRef(0);

  const fetchUserPosts = useCallback(
    async (currentPage) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      setLoading(true);
      setLoadError(null);
      try {
        // Single call to the aggregation endpoint: it returns the user AND
        // their paginated posts together, so no second request is ever made.
        const response = await postsService.getUserPosts(userId, { page: currentPage, limit: LIMIT });
        if (latestRequestId.current !== requestId) {
          return;
        }
        setUser(response.data.user);
        setPosts(response.data.posts);
        setPagination(response.pagination);
      } catch (error) {
        if (latestRequestId.current !== requestId) {
          return;
        }
        setLoadError(error instanceof ApiClientError ? error.message : "Failed to load this user's posts.");
      } finally {
        if (latestRequestId.current === requestId) {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    async function run() {
      await fetchUserPosts(page);
    }
    run();
  }, [page, fetchUserPosts]);

  function handlePageChange(nextPage) {
    if (nextPage < 1 || (pagination.totalPages > 0 && nextPage > pagination.totalPages)) {
      return;
    }
    setPage(nextPage);
  }

  const stateStatus = loading ? 'loading' : loadError ? 'error' : posts.length === 0 ? 'empty' : null;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href="/posts" className="text-sm text-primary hover:underline">
        ← Back to Public Posts
      </Link>
      <h1 className="mt-2 text-xl font-semibold">
        {user ? `${user.firstName} ${user.lastName}'s Posts` : 'User Posts'}
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        {stateStatus === 'loading' ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-primary" />
          </div>
        ) : stateStatus === 'error' ? (
          <ErrorMessage message={loadError} />
        ) : stateStatus === 'empty' ? (
          <EmptyState message="This user hasn't posted anything yet." />
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} linkToAuthor={false} />)
        )}
      </div>

      {!stateStatus && pagination.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
