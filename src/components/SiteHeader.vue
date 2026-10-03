<script setup>
import { useRouter } from 'vue-router'
import { useAuth, logout } from '../composables/useAuth.js'
import { SITE_TITLE } from '../config.js'

const auth = useAuth()
const router = useRouter()

async function onLogout() {
  await logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <router-link class="brand" :to="{ name: 'home' }">{{ SITE_TITLE }}</router-link>

      <nav class="nav">
        <router-link :to="{ name: 'home' }">Beranda</router-link>
        <router-link v-if="auth.authenticated" :to="{ name: 'dashboard' }">Dashboard</router-link>
        <router-link v-else-if="auth.authRequired" :to="{ name: 'login' }">Masuk</router-link>
        <button
          v-if="auth.authenticated && auth.authRequired"
          class="link-button"
          type="button"
          @click="onLogout"
        >
          Keluar
        </button>
      </nav>
    </div>
  </header>
</template>
