import apiClient from './client';

export async function searchUsers(query) {
  const response = await apiClient.get('/users/search', { params: { q: query } });
  return response.data;
}

export async function updateMyProfile(data) {
  const response = await apiClient.patch('/users/me', data);
  return response.data;
}

export async function getMe() {
  const response = await apiClient.get('/users/me');
  return response.data;
}

export async function updateEmail(data) {
  const response = await apiClient.patch('/users/me/email', data);
  return response.data;
}