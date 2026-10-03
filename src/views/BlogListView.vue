<script setup>
import { onMounted } from 'vue'
import { listPublished } from '../content.js'
import PostCard from '../components/PostCard.vue'
import { SITE_TITLE, SITE_DESCRIPTION } from '../config.js'

// Post terbit sudah ikut dibundel saat build — tanpa panggilan API.
const posts = listPublished()

onMounted(() => {
  document.title = SITE_TITLE
})
</script>

<template>
  <div>
    <section class="hero">
      <h1>{{ SITE_TITLE }}</h1>
      <p>{{ SITE_DESCRIPTION }}</p>
    </section>

    <div v-if="posts.length" class="post-list">
      <PostCard v-for="post in posts" :key="post.slug" :post="post" />
    </div>

    <div v-else class="empty-state">
      <h2>Belum ada post</h2>
      <p class="muted">
        Tulis post pertama lewat dashboard, atau tambahkan file .md baru di folder
        <code>blog-posts/</code>.
      </p>
      <router-link class="btn btn--primary" :to="{ name: 'dashboard' }">Buka dashboard</router-link>
    </div>
  </div>
</template>
