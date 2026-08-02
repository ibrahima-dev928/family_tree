import apiClient from './client';

export async function listConversations() {
  const response = await apiClient.get('/conversations');
  return response.data;
}

export async function getMessages(conversationId, params = {}) {
  const response = await apiClient.get(`/conversations/${conversationId}/messages`, { params });
  return response.data;
}

export async function createConversation(data) {
  const response = await apiClient.post('/conversations', data);
  return response.data;
}