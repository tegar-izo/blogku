<script setup>
import { listPublished } from '../content.js'
import PostCard from '../components/PostCard.vue'
import { SITE_TITLE, SITE_DESCRIPTION } from '../config.js'
import { useHead } from '@unhead/vue'

// Post terbit sudah ikut dibundel saat build — tanpa panggilan API.
const posts = listPublished()

useHead({
  title: SITE_TITLE,
  meta: [{ name: 'description', content: SITE_DESCRIPTION }],
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
      <p class="muted">Tulis post pertama lewat dashboard.</p>
      <router-link class="btn btn--primary" :to="{ name: 'dashboard' }">Buka dashboard</router-link>
    </div>
  </div>
</template>
