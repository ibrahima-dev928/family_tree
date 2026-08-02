import apiClient from './client';

export async function getPerson(id) {
  const response = await apiClient.get(`/persons/${id}`);
  return response.data;
}

export async function createPerson(data) {
  const response = await apiClient.post('/persons', data);
  return response.data;
}

export async function listPersons(params = {}) {
  const response = await apiClient.get('/persons', { params });
  return response.data;
}

export async function updatePerson(id, data) {
  const response = await apiClient.patch(`/persons/${id}`, data);
  return response.data;
}

export async function uploadPersonPhoto(personId, file) {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await apiClient.post(`/persons/${personId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deletePerson(id) {
  const response = await apiClient.delete(`/persons/${id}`);
  return response.data;
}