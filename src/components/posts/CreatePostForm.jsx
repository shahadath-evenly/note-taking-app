'use client';

import { useState } from 'react';
import { createPostSchema } from '@/validations/posts/createPost.schema';
import { validateForm } from '@/lib/validateForm';
import { ApiClientError } from '@/lib/ApiClientError';
import FormField from '@/components/forms/FormField';
import Button from '@/components/forms/Button';
import ErrorMessage from '@/components/common/ErrorMessage';
import Spinner from '@/components/common/Spinner';

const BLANK_FORM = { title: '', content: '' };

export default function CreatePostForm({ onSubmit }) {
  const [form, setForm] = useState(BLANK_FORM);
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

    const { values, errors } = await validateForm(createPostSchema, form);
    setFieldErrors(errors);
    if (!values) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setForm(BLANK_FORM);
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      noValidate
    >
      <FormField label="Title" name="title" value={form.title} onChange={handleChange} error={fieldErrors.title} />
      <FormField
        label="Content"
        name="content"
        as="textarea"
        rows={3}
        value={form.content}
        onChange={handleChange}
        error={fieldErrors.content}
      />
      <ErrorMessage message={formError} />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          Post
        </Button>
      </div>
    </form>
  );
}
