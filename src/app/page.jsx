'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: LockIcon,
    title: 'Secure by design',
    body: 'Passwords are hashed, sessions use JWTs, and every role-restricted page is backed by a real server-side check — not just a hidden button.',
  },
  {
    icon: NoteIcon,
    title: 'Notes that are just yours',
    body: 'A clean two-pane editor for writing and organizing private notes only you can see.',
  },
  {
    icon: GlobeIcon,
    title: 'Share with everyone',
    body: 'Post publicly and browse what others have shared — no account needed to read.',
  },
];

const STEPS = [
  { step: '1', title: 'Create an account', body: 'Sign up in a few seconds — just a name, email, and password.' },
  { step: '2', title: 'Write something', body: 'Jot down a private note, or publish a post for everyone to see.' },
  { step: '3', title: 'Pick up anywhere', body: 'Log back in anytime to keep writing, reading, or sharing.' },
];

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-5xl px-4 pt-16 pb-12 text-center sm:pt-24">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Your notes, private. <span className="text-primary">Your voice, public.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
          Secure Notes is a simple place to keep what&apos;s yours to yourself, and share what you want with
          everyone else.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isLoading ? null : isAuthenticated ? (
            <>
              <Link
                href={isAdmin ? '/admin/users' : '/notes'}
                className="rounded bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {isAdmin ? 'Go to User Management' : 'Go to My Notes'}
              </Link>
              <Link
                href="/posts"
                className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Browse Public Posts
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Get started — it&apos;s free
              </Link>
              <Link
                href="/login"
                className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Log in
              </Link>
              <Link
                href="/posts"
                className="px-2 py-2.5 text-sm font-medium text-primary hover:underline"
              >
                Browse public posts →
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="inline-flex rounded-md bg-primary/10 p-2.5 text-primary">
                <Icon />
              </div>
              <h2 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
        <h2 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">How it works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ step, title, body }) => (
            <div key={step} className="text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {step}
              </div>
              <h3 className="mt-3 font-medium text-zinc-900 dark:text-zinc-50">{title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
