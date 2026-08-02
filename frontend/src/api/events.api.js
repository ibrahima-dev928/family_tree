import apiClient from './client';

export async function listEvents(params = {}) {
  const response = await apiClient.get('/events', { params });
  return response.data;
}

export async function getEvent(id) {
  const response = await apiClient.get(`/events/${id}`);
  return response.data;
}

export async function createEvent(data) {
  const response = await apiClient.post('/events', data);
  return response.data;
}

export async function rsvpEvent(id, data) {
  const response = await apiClient.post(`/events/${id}/rsvp`, data);
  return response.data;
}