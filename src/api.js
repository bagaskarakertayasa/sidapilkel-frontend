const BASE_URL = '/api/v1';
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60; // 604,800 detik = 1 minggu

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name, value, maxAge = ONE_WEEK_SECONDS) {
  if (typeof document === 'undefined') return;
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
  }
}

export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
}

export function getToken() {
  return getCookie('token');
}

export function setToken(token) {
  if (token) {
    setCookie('token', token, ONE_WEEK_SECONDS);
  } else {
    removeCookie('token');
  }
}

export function getUser() {
  const userStr = getCookie('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (user) {
    setCookie('user', JSON.stringify(user), ONE_WEEK_SECONDS);
  } else {
    removeCookie('user');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to JSON
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
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
      setToken(null);
      setUser(null);
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
