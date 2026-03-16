const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('cms_token') || '';
}

export function setToken(token) {
  localStorage.setItem('cms_token', token);
}

export function clearToken() {
  localStorage.removeItem('cms_token');
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  };

  if (body !== undefined && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    opts.body = body;
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 401 || res.status === 403) {
    clearToken();
    window.location.reload();
    throw new Error('Brak autoryzacji');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd serwera' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),

  // File upload
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('POST', '/media', formData);
  }
};
