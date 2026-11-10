import * as yup from 'yup';

export const createPostSchema = yup.object({
  title: yup.string().trim().max(150, 'Title must be at most 150 characters').required('Title is required'),
  content: yup.string().trim().required('Content is required'),
});
