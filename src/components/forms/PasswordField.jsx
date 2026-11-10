'use client';

import { useState } from 'react';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.17 3.19m-6.25 2.56a3 3 0 1 1-4.24-4.24" />
      <path d="M6.6 6.6A18.5 18.5 0 0 0 1 12s4 8 11 8a9.3 9.3 0 0 0 5.4-1.61" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

// A FormField variant specifically for passwords: same label/error layout,
// plus a show/hide toggle so a user can check what they typed. There is
// never any value in truly hiding a password the user themself is typing —
// the input still submits as `type="password"` by default, this just lets
// them reveal it on demand instead of guessing from `•••••`.
export default function PasswordField({ label, name, error, className = '', ...rest }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isVisible ? 'text' : 'password'}
          className={`w-full rounded border border-zinc-300 px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
