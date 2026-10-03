<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api.js'
import { formatDate } from '../utils.js'
import { SITE_TITLE } from '../config.js'

const posts = ref([])
const loading = ref(true)
const error = ref('')

const stats = computed(() => ({
  total: posts.value.length,
  terbit: posts.value.filter((post) => !post.draft).length,
  draf: posts.value.filter((post) => post.draft).length,
  kata: posts.value.reduce((sum, post) => sum + (post.words || 0), 0),
}))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.listPosts('all')
    posts.value = data.posts
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function remove(post) {
  const ok = window.confirm(
    `Hapus post "${post.title}"?\n\nFile blog-posts/${post.slug}/post.md akan ikut terhapus.`,
  )
  if (!ok) return
  try {
    await api.deletePost(post.slug)
    posts.value = posts.value.filter((item) => item.slug !== post.slug)
  } catch (err) {
    error.value = err.message
  }
}

onMounted(() => {
  document.title = `Dashboard · ${SITE_TITLE}`
  load()
})
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1>Semua post</h1>
      </div>
      <router-link class="btn btn--primary" :to="{ name: 'post-baru' }">+ Tulis post</router-link>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat__value">{{ stats.total }}</span>
        <span class="stat__label">Total post</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ stats.terbit }}</span>
        <span class="stat__label">Terbit</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ stats.draf }}</span>
        <span class="stat__label">Draf</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ stats.kata.toLocaleString('id-ID') }}</span>
        <span class="stat__label">Total kata</span>
      </div>
    </div>

    <p v-if="error" class="alert alert--error">{{ error }}</p>
    <p v-if="loading" class="muted">Memuat post…</p>

    <div v-else-if="!posts.length" class="empty-state">
      <h2>Belum ada post</h2>
      <p class="muted">Mulai tulis post pertama kamu.</p>
      <router-link class="btn btn--primary" :to="{ name: 'post-baru' }">+ Tulis post</router-link>
    </div>

    <ul v-else class="manage-list">
      <li v-for="post in posts" :key="post.slug" class="manage-item">
        <div class="manage-item__main">
          <router-link
            class="manage-item__title"
            :to="{ name: 'post-edit', params: { slug: post.slug } }"
          >
            {{ post.title }}
          </router-link>
          <div class="manage-item__meta">
            <span class="badge" :class="post.draft ? 'badge--draft' : 'badge--published'">
              {{ post.draft ? 'Draf' : 'Terbit' }}
            </span>
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            <code>/{{ post.slug }}</code>
            <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        <div class="manage-item__actions">
          <router-link
            class="btn btn--ghost"
            :to="{ name: 'post-edit', params: { slug: post.slug } }"
          >
            Ubah
          </router-link>
          <router-link v-if="!post.draft" class="btn btn--ghost" :to="{ name: 'post', params: { slug: post.slug } }">
            Lihat
          </router-link>
          <button class="btn btn--danger" type="button" @click="remove(post)">Hapus</button>
        </div>
      </li>
    </ul>
  </div>
</template>
