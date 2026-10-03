// Klien API sederhana untuk berkomunikasi dengan server Express.
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const error = new Error(data?.error || `Permintaan gagal (kode ${res.status})`)
    error.status = res.status
    throw error
  }
  return data
}

const encode = (value) => encodeURIComponent(value)

export const api = {
  me: () => request('/api/me'),
  login: (password) => request('/api/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('/api/logout', { method: 'POST' }),

  listPosts: (scope = 'published') =>
    request(scope === 'all' ? '/api/posts?scope=all' : '/api/posts'),
  getPost: (slug) => request(`/api/posts/${encode(slug)}`),
  createPost: (payload) => request('/api/posts', { method: 'POST', body: JSON.stringify(payload) }),
  updatePost: (slug, payload) =>
    request(`/api/posts/${encode(slug)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePost: (slug) => request(`/api/posts/${encode(slug)}`, { method: 'DELETE' }),
}
