import apiClient from './client';

export async function createParentChild(data) {
  const response = await apiClient.post('/relations/parent-child', data);
  return response.data;
}

export async function createPartnership(data) {
  const response = await apiClient.post('/relations/partnerships', data);
  return response.data;
}

export async function deleteParentChild(id) {
  const response = await apiClient.delete(`/relations/parent-child/${id}`);
  return response.data;
}

export async function deletePartnership(id) {
  const response = await apiClient.delete(`/relations/partnerships/${id}`);
  return response.data;
}