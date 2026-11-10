import * as yup from 'yup';

export const createNoteSchema = yup.object({
  title: yup.string().trim().required('Title is required'),
  content: yup.string().trim().required('Content is required'),
});
