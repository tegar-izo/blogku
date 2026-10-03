<script setup>
import SiteHeader from './components/SiteHeader.vue'
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <main class="page">
      <router-view />
    </main>
  </div>
</template>
