import { createRouter, createWebHistory } from 'vue-router'
import { refreshAuth, useAuth } from './composables/useAuth.js'
import BlogListView from './views/BlogListView.vue'
import PostView from './views/PostView.vue'
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import EditorView from './views/EditorView.vue'
import NotFoundView from './views/NotFoundView.vue'

const routes = [
  { path: '/', name: 'home', component: BlogListView },
  { path: '/post/:slug', name: 'post', component: PostView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  {
    // Dipisah dari /dashboard/post/:slug supaya slug "baru" tetap bisa dipakai post.
    path: '/dashboard/tulis',
    name: 'post-baru',
    component: EditorView,
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard/post/:slug',
    name: 'post-edit',
    component: EditorView,
    meta: { requiresAuth: true },
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.path !== from.path) return { top: 0 }
  },
})

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

export default router
