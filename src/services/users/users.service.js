import { apiClient } from '@/lib/apiClient';

export function listUsers(params, token) {
  return apiClient.get('/admin/users', { params, token });
}

export function createUser(data, token) {
  return apiClient.post('/admin/users', data, { token });
}

export function getUser(id, token) {
  return apiClient.get(`/admin/users/${id}`, { token });
}

export function updateUser(id, data, token) {
  return apiClient.patch(`/admin/users/${id}`, data, { token });
}

export function deleteUser(id, token) {
  return apiClient.delete(`/admin/users/${id}`, { token });
}

export function getUsersGroupedByInterests(params, token) {
  return apiClient.get('/admin/users/grouped-by-interests', { params, token });
}
