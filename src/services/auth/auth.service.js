import { apiClient } from '@/lib/apiClient';

export function register({ firstName, lastName, email, password }) {
  return apiClient.post('/auth/register', { firstName, lastName, email, password });
}

export function login({ email, password }) {
  return apiClient.post('/auth/login', { email, password });
}

export function getMe(token) {
  return apiClient.get('/auth/me', { token });
}
