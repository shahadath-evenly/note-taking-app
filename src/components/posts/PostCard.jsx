'use client';

import { useState } from 'react';
import Link from 'next/link';

const TRUNCATE_LENGTH = 200;

// Facebook-style "See more"/"See less": content past 200 chars is clipped
// with a clickable toggle, scoped to this card's own local state so
// expanding one post never affects any other post in the feed.
export default function PostCard({ post, linkToAuthor = true }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const content = post.content || '';
  const isTruncatable = content.length > TRUNCATE_LENGTH;
  const visibleContent = isExpanded || !isTruncatable ? content : content.slice(0, TRUNCATE_LENGTH);

  return (
    <article className="rounded border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{post.title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        <span>
          {visibleContent}
          {isTruncatable && !isExpanded ? '…' : null}
        </span>{' '}
        {isTruncatable ? (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="font-medium text-primary hover:underline"
          >
            {isExpanded ? 'See less' : 'See more'}
          </button>
        ) : null}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
        <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '—'}</span>
        {linkToAuthor && post.userId ? (
          <Link href={`/users/${post.userId}/posts`} className="text-primary hover:underline">
            View author&apos;s posts
          </Link>
        ) : null}
      </div>
    </article>
  );
}
