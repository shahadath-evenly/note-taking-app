'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerSchema } from '@/validations/auth/register.schema';
import { validateForm } from '@/lib/validateForm';
import { ApiClientError } from '@/lib/ApiClientError';
import FormField from '@/components/forms/FormField';
import PasswordField from '@/components/forms/PasswordField';
import Button from '@/components/forms/Button';
import ErrorMessage from '@/components/common/ErrorMessage';
import Spinner from '@/components/common/Spinner';

const INITIAL_FORM = { firstName: '', lastName: '', email: '', password: '' };

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState(INITIAL_FORM);
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

    // Registration always creates a normal user — there is no role field in
    // this form or in registerSchema, and the backend ignores/rejects any
    // client-supplied role regardless.
    const { values, errors } = await validateForm(registerSchema, form);
    setFieldErrors(errors);
    if (!values) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register(values);
      router.push('/login?registered=1');
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">Create an account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          value={form.firstName}
          onChange={handleChange}
          error={fieldErrors.firstName}
        />
        <FormField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          value={form.lastName}
          onChange={handleChange}
          error={fieldErrors.lastName}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <ErrorMessage message={formError} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          Sign up
        </Button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
