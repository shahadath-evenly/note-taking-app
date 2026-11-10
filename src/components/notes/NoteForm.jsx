'use client';

import { useState } from 'react';
import { createNoteSchema } from '@/validations/notes/createNote.schema';
import { validateForm } from '@/lib/validateForm';
import { ApiClientError } from '@/lib/ApiClientError';
import FormField from '@/components/forms/FormField';
import Button from '@/components/forms/Button';
import ErrorMessage from '@/components/common/ErrorMessage';
import Spinner from '@/components/common/Spinner';

// This form always submits the full {title, content} object, whether
// creating or editing — it's never a sparse PATCH from the UI's point of
// view. createNoteSchema (both fields required) is used for both modes
// instead of the backend's updateNote schema, because that schema's
// "at least one field present" check would not catch a title/content
// emptied out during an edit (the key would still be present, just blank).
export default function NoteForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    content: initialValues?.content || '',
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

    const { values, errors } = await validateForm(createNoteSchema, form);
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
      <FormField label="Title" name="title" value={form.title} onChange={handleChange} error={fieldErrors.title} />
      <FormField
        label="Content"
        name="content"
        as="textarea"
        rows={5}
        value={form.content}
        onChange={handleChange}
        error={fieldErrors.content}
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
