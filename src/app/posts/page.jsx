'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/lib/ApiClientError';
import * as postsService from '@/services/posts/posts.service';
import PostCard from '@/components/posts/PostCard';
import CreatePostForm from '@/components/posts/CreatePostForm';
import Spinner from '@/components/common/Spinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/forms/Button';

const DEFAULT_QUERY = { page: 1, limit: 10 };
const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0 };

export default function PostsPage() {
  const { isAuthenticated, isLoading: isAuthLoading, token } = useAuth();

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Guards against an older, slower request overwriting a newer one's
  // result (e.g. a fast page click right after a slow prior request).
  const latestRequestId = useRef(0);

  const fetchPosts = useCallback(async (currentQuery) => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    setLoading(true);
    setLoadError(null);
    try {
      const response = await postsService.listPosts(currentQuery);
      if (latestRequestId.current !== requestId) {
        return;
      }
      setPosts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      if (latestRequestId.current !== requestId) {
        return;
      }
      setLoadError(error instanceof ApiClientError ? error.message : 'Failed to load posts.');
    } finally {
      if (latestRequestId.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    async function run() {
      await fetchPosts(query);
    }
    run();
  }, [query, fetchPosts]);

  async function handleCreatePost(values) {
    await postsService.createPost(values, token);
    // Jump back to page 1 (newest-first) so the just-created post is visible;
    // if already there, just refetch the same page.
    if (query.page === 1) {
      fetchPosts(query);
    } else {
      setQuery((prev) => ({ ...prev, page: 1 }));
    }
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || (pagination.totalPages > 0 && nextPage > pagination.totalPages)) {
      return;
    }
    setQuery((prev) => ({ ...prev, page: nextPage }));
  }

  const stateStatus = loading ? 'loading' : loadError ? 'error' : posts.length === 0 ? 'empty' : null;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-xl font-semibold">Public Posts</h1>

      <div className="mt-4">
        {isAuthLoading ? null : isAuthenticated ? (
          <CreatePostForm onSubmit={handleCreatePost} />
        ) : (
          <p className="rounded border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>{' '}
            to create a post.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {stateStatus === 'loading' ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-primary" />
          </div>
        ) : stateStatus === 'error' ? (
          <ErrorMessage message={loadError} />
        ) : stateStatus === 'empty' ? (
          <EmptyState message="No posts yet." />
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
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
