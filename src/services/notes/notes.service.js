import { apiClient } from '@/lib/apiClient';

export function listNotes(params, token) {
  return apiClient.get('/notes', { params, token });
}

export function createNote(data, token) {
  return apiClient.post('/notes', data, { token });
}

export function getNote(id, token) {
  return apiClient.get(`/notes/${id}`, { token });
}

export function updateNote(id, data, token) {
  return apiClient.patch(`/notes/${id}`, data, { token });
}

export function deleteNote(id, token) {
  return apiClient.delete(`/notes/${id}`, { token });
}

export function listAllNotes(params, token) {
  return apiClient.get('/admin/notes', { params, token });
}
