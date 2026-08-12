import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function importExcel(data) {
  const response = await axios.post(`${API_BASE}/api/import`, data, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
  return response.data;
}

export async function exportExcel() {
  const response = await axios.get(`${API_BASE}/api/export`, {
    responseType: 'blob',
    withCredentials: true,
  });
  return response.data;
}