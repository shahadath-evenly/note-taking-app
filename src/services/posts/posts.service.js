import { apiClient } from '@/lib/apiClient';

export function listPosts(params) {
  return apiClient.get('/posts', { params });
}

export function createPost(data, token) {
  return apiClient.post('/posts', data, { token });
}

export function getUserPosts(userId, params) {
  return apiClient.get(`/users/${userId}/posts`, { params });
}
