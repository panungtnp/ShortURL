// Tiny fetch client for the Short URL API.
// VITE_API_BASE_URL is empty in local dev (Vite proxies /api), set in prod.

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

export const api = {
  createLink: (payload) =>
    request('/api/links', { method: 'POST', body: JSON.stringify(payload) }),
  listLinks: (q = '') =>
    request(`/api/links${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  linkStats: (id) => request(`/api/links/${id}/stats`),
  checkAlias: (code) => request(`/api/links/check?code=${encodeURIComponent(code)}`),
};
