const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Turn any DRF error payload into a readable string.
export function errMsg(data) {
  if (data == null) return 'Something went wrong';
  if (typeof data === 'string') {
    return data.trim().startsWith('<') ? 'Server error' : data;
  }
  if (Array.isArray(data)) return data.map(errMsg).join(' ');
  if (typeof data === 'object') {
    const plain = ['detail', 'message', 'error', 'non_field_errors'];
    return Object.entries(data)
      .map(([k, v]) => (plain.includes(k) ? errMsg(v) : `${k.replace(/_/g, ' ')}: ${errMsg(v)}`))
      .join(' ');
  }
  return String(data);
}

export class ApiError extends Error {
  constructor(status, data) {
    super(errMsg(data));
    this.status = status;
    this.data = data;
  }
}

export const getToken = () => localStorage.getItem('token');

/**
 * api('listings/', { params: {type:'O'} })
 * api('transactions/', { method:'POST', body:{...} })
 * api('listings/', { method:'POST', form: FormData })
 * Absolute URLs (e.g. DRF `next` links) are used as-is.
 */
export async function api(path, { method = 'GET', body, form, params, auth = true } = {}) {
  let url = /^https?:/.test(path) ? path : `${BASE}/${path}`;
  if (params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v);
    });
    const s = q.toString();
    if (s) url += (url.includes('?') ? '&' : '?') + s;
  }
  const headers = { Accept: 'application/json' };
  const token = getToken();
  // A stale token makes DRF answer 401 even on public endpoints, so login/register skip it.
  if (token && auth) headers.Authorization = `Token ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    if (res.status === 401 && token && auth) window.dispatchEvent(new Event('unauthorized'));
    throw new ApiError(res.status, data);
  }
  return data;
}

// Fetch every page of a list endpoint that may or may not be paginated.
export async function apiAll(path, opts) {
  let data = await api(path, opts);
  if (Array.isArray(data)) return data;
  const items = [...(data.results || [])];
  let guard = 0;
  while (data.next && guard++ < 30) {
    data = await api(data.next);
    items.push(...data.results);
  }
  return items;
}
