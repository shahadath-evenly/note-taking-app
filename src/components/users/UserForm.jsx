'use client';

import { useState } from 'react';
import { createUserSchema } from '@/validations/users/createUser.schema';
import { validateForm } from '@/lib/validateForm';
import { ApiClientError } from '@/lib/ApiClientError';
import { ROLES } from '@/constants/roles';
import FormField from '@/components/forms/FormField';
import Button from '@/components/forms/Button';
import ErrorMessage from '@/components/common/ErrorMessage';
import Spinner from '@/components/common/Spinner';

// Edits reuse createUserSchema's field rules (firstName/lastName/email
// required, role/interests valid) minus `password` — there is no password
// reset feature, and the backend's own update schema only requires "at
// least one field present," which (since this form always submits the
// complete object) would let a blank firstName/lastName slip through.
const editUserSchema = createUserSchema.omit(['password']);

function parseInterests(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function UserForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const isEdit = Boolean(initialValues);
  const schema = isEdit ? editUserSchema : createUserSchema;

  const [form, setForm] = useState({
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    email: initialValues?.email || '',
    password: '',
    role: initialValues?.role || ROLES.USER,
    interestsText: (initialValues?.interests || []).join(', '),
  });
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

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role,
      interests: parseInterests(form.interestsText),
    };
    if (!isEdit) {
      payload.password = form.password;
    }

    const { values, errors } = await validateForm(schema, payload);
    setFieldErrors(errors);
    if (!values) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        label="First name"
        name="firstName"
        value={form.firstName}
        onChange={handleChange}
        error={fieldErrors.firstName}
      />
      <FormField
        label="Last name"
        name="lastName"
        value={form.lastName}
        onChange={handleChange}
        error={fieldErrors.lastName}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        error={fieldErrors.email}
      />
      {!isEdit ? (
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          className="rounded border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value={ROLES.USER}>User</option>
          <option value={ROLES.ADMIN}>Admin</option>
        </select>
        {fieldErrors.role ? <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.role}</p> : null}
      </div>

      <FormField
        label="Interests (comma-separated)"
        name="interestsText"
        value={form.interestsText}
        onChange={handleChange}
        error={fieldErrors.interests}
      />

      <ErrorMessage message={formError} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
