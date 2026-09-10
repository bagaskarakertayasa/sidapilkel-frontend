const BASE_URL = '/api/v1';

async function request(endpoint, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // Token is stored in HttpOnly cookie set by backend — browser sends it automatically.
  // No Authorization header needed for browser requests.
  // API clients (Postman/curl) can still use Authorization: Bearer <token>.

  // If not FormData, default to JSON
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // ensure HttpOnly cookies are sent
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const errorMsg = data?.message || data?.error || (typeof data === 'string' ? data : 'Terjadi kesalahan pada server');
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    err.errors = data?.errors;
    err.retryAfter = response.headers.get('Retry-After');
    throw err;
  }

  return data;
}

export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) =>
    request(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (url, body) =>
    request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: (url, body) =>
    request(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  del: (url) => request(url, { method: 'DELETE' }),
  upload: (url, formData) =>
    request(url, {
      method: 'POST',
      body: formData,
    }),
};
