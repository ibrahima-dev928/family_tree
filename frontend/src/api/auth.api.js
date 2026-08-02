import apiClient from './client';

export async function register(data) {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
}

export async function login(data) {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
}

export async function refreshToken(refreshToken) {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
}

export async function changePassword(data) {
  const response = await apiClient.post('/auth/change-password', data);
  return response.data;
}