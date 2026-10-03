import BlogListView from './views/BlogListView.vue'
import PostView from './views/PostView.vue'
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import EditorView from './views/EditorView.vue'
import NotFoundView from './views/NotFoundView.vue'

export const routes = [
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

export function scrollBehavior(to, from, saved) {
  if (saved) return saved
  if (to.path !== from.path) return { top: 0 }
}
