import apiClient from './client';

export async function getFullTree() {
  const response = await apiClient.get('/tree');
  return response.data;
}

export async function getSubtree(personId) {
  const response = await apiClient.get(`/tree/${personId}/subtree`);
  return response.data;
}