// Sumber konten untuk halaman publik.
// Post terbit dibundel saat build (tanpa API), sehingga cepat dan draf tidak
// pernah ikut terkirim ke browser. Pembaca (tidak login) selalu memakai bundel,
// sedangkan yang sudah masuk memakai API supaya hasil simpan terbaru langsung terlihat.
import published from 'virtual:published-posts'
import { api } from './api.js'
import { useAuth } from './composables/useAuth.js'

export function listPublished() {
  return published
}

export function getPublished(slug) {
  return published.find((post) => post.slug === slug) || null
}

export async function fetchPost(slug) {
  if (useAuth().authenticated) {
    try {
      const { post } = await api.getPost(slug)
      return post
    } catch (err) {
      if (err.status !== 404) throw err
    }
  }

  const bundled = getPublished(slug)
  if (bundled) return bundled

  // Cadangan terakhir (mis. post baru yang belum ikut bundel build terakhir).
  const { post } = await api.getPost(slug)
  return post
}
