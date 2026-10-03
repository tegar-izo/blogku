<script setup>
import { formatDate } from '../utils.js'

defineProps({
  post: { type: Object, required: true },
})
</script>

<template>
  <article class="post-card">
    <div class="post-card__meta">
      <time :datetime="post.date">{{ formatDate(post.date) }}</time>
      <span v-if="post.readingMinutes">· {{ post.readingMinutes }} menit baca</span>
      <span v-if="post.draft" class="badge badge--draft">Draf</span>
    </div>

    <h2 class="post-card__title">
      <router-link :to="{ name: 'post', params: { slug: post.slug } }">{{ post.title }}</router-link>
    </h2>

    <p v-if="post.excerpt" class="post-card__excerpt">{{ post.excerpt }}</p>

    <ul v-if="post.tags && post.tags.length" class="tag-list">
      <li v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</li>
    </ul>
  </article>
</template>
