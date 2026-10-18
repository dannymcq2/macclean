// Central API fetch utility ensuring compatibility with both web dev server and Electron file:// protocol
export const API_BASE = 'http://localhost:3001';

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  return fetch(url, options);
}
