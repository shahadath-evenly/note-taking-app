'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/validations/auth/login.schema';
import { validateForm } from '@/lib/validateForm';
import { ApiClientError } from '@/lib/ApiClientError';
import { ROLES } from '@/constants/roles';
import FormField from '@/components/forms/FormField';
import Button from '@/components/forms/Button';
import ErrorMessage from '@/components/common/ErrorMessage';
import Spinner from '@/components/common/Spinner';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const { values, errors } = await validateForm(loginSchema, form);
    setFieldErrors(errors);
    if (!values) {
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(values);
      router.push(loggedInUser.role === ROLES.ADMIN ? '/admin/users' : '/notes');
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-xl font-semibold">Log in</h1>
        {justRegistered ? (
          <p className="mt-2 text-sm text-primary">Account created. You can now log in.</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <ErrorMessage message={formError} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          Log in
        </Button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
