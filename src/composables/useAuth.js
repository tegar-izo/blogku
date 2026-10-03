import { reactive } from 'vue'
import { api } from '../api.js'

// Status login global, diisi ulang lewat refreshAuth().
const state = reactive({
  loaded: false,
  authRequired: false,
  authenticated: false,
})

export function useAuth() {
  return state
}

export async function refreshAuth() {
  try {
    const data = await api.me()
    state.authRequired = Boolean(data.authRequired)
    state.authenticated = Boolean(data.authenticated)
  } catch {
    state.authRequired = false
    state.authenticated = false
  }
  state.loaded = true
  return state
}

export async function login(password) {
  const data = await api.login(password)
  state.authRequired = Boolean(data.authRequired)
  state.authenticated = true
  state.loaded = true
}

export async function logout() {
  try {
    await api.logout()
  } finally {
    state.authenticated = false
  }
}
