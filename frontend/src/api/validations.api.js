import apiClient from './client';

export async function listPendingValidations() {
  const response = await apiClient.get('/validations/pending');
  return response.data;
}

export async function approveValidation(id, reviewNote) {
  const response = await apiClient.post(`/validations/${id}/approve`, { reviewNote });
  return response.data;
}

export async function rejectValidation(id, reviewNote) {
  const response = await apiClient.post(`/validations/${id}/reject`, { reviewNote });
  return response.data;
}