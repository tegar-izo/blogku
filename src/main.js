import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes, scrollBehavior } from './router.js'
import { refreshAuth, useAuth } from './composables/useAuth.js'
import published from 'virtual:published-posts'
import './assets/main.css'

export const createApp = ViteSSG(
  App,
  { routes, scrollBehavior },
  ({ router }) => {
    router.beforeEach(async (to) => {
      // Pastikan status login sudah diketahui sebelum halaman pertama dirender,
      // supaya menu di header tidak salah tampil.
      const auth = useAuth()
      if (!auth.loaded) await refreshAuth()

      if (to.meta.requiresAuth && !auth.authenticated) {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
      return true
    })
  },
)

// Hanya halaman publik yang dipra-render; dashboard/editor tetap SPA (butuh login).
export function includedRoutes(paths) {
  return ['/', '/login', ...published.map((post) => `/post/${post.slug}`)]
}
