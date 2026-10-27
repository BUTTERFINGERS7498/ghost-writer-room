import { io } from 'socket.io-client';

// Empty in development: Vite proxies /api and /socket.io to the server.
const BASE = import.meta.env.VITE_API_URL || '';

export const TOKEN_KEY = 'gw_token';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const socket = BASE ? io(BASE) : io();
