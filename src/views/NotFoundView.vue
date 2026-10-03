<template>
  <div class="empty-state">
    <h1>404 — Halaman tidak ditemukan</h1>
    <p class="muted">Halaman yang kamu tuju tidak ada.</p>
    <router-link class="btn btn--primary" :to="{ name: 'home' }">Ke beranda</router-link>
  </div>
</template>
