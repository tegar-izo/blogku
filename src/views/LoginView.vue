<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, useAuth } from '../composables/useAuth.js'
import { SITE_TITLE } from '../config.js'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const password = ref('')
const error = ref('')
const loading = ref(false)

function goNext() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
  router.push(redirect)
}

onMounted(() => {
  document.title = `Masuk · ${SITE_TITLE}`
  if (auth.authenticated) goNext()
})

async function submit() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    await login(password.value)
    password.value = ''
    goNext()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="narrow">
    <h1>Masuk ke dashboard</h1>
    <p class="muted">Masukkan password admin untuk mengelola post.</p>

    <p v-if="error" class="alert alert--error">{{ error }}</p>

    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          autofocus
          required
        />
      </div>
      <button class="btn btn--primary" type="submit" :disabled="loading">
        {{ loading ? 'Memeriksa…' : 'Masuk' }}
      </button>
    </form>
  </div>
</template>
