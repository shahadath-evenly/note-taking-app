import * as yup from 'yup';

// Content is intentionally optional (defaults to an empty string) —
// mirrors the backend: a note can be saved with just a title.
export const createNoteSchema = yup.object({
  title: yup.string().trim().max(150, 'Title must be at most 150 characters').required('Title is required'),
  content: yup.string().trim().default(''),
});
