<script setup>
import SiteHeader from './components/SiteHeader.vue'
import { SITE_TITLE, SITE_DESCRIPTION } from './config.js'
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <main class="page">
      <router-view />
    </main>
    <footer class="site-footer">
      <p>{{ SITE_TITLE }} — {{ SITE_DESCRIPTION }}</p>
      <p class="muted">Konten disimpan sebagai file <code>.md</code> di folder <code>blog-posts/</code>.</p>
    </footer>
  </div>
</template>
