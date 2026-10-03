<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPost } from '../content.js'
import { renderMarkdown } from '../markdown.js'
import { formatDate } from '../utils.js'
import { SITE_TITLE } from '../config.js'

const route = useRoute()
const post = ref(null)
const html = ref('')
const status = ref('loading') // loading | ok | not-found | error
const message = ref('')

async function load() {
  status.value = 'loading'
  post.value = null
  html.value = ''
  message.value = ''

  try {
    const data = await fetchPost(route.params.slug)
    if (!data) {
      status.value = 'not-found'
      document.title = `Tidak ditemukan · ${SITE_TITLE}`
      return
    }

    post.value = data

    // Judul sudah dirender terpisah, jadi baris "# Judul" di isi tidak diulang.
    const heading = /^\s*#\s+[^\n]*\n?/.exec(data.body)
    const content = heading ? data.body.slice(heading[0].length) : data.body
    html.value = renderMarkdown(content)
    status.value = 'ok'
    document.title = `${data.title} · ${SITE_TITLE}`
  } catch (err) {
    status.value = err.status === 404 ? 'not-found' : 'error'
    message.value = err.message
    document.title = `Tidak ditemukan · ${SITE_TITLE}`
  }
}

watch(() => route.params.slug, load, { immediate: true })
</script>

<template>
  <article v-if="status === 'ok' && post" class="post">
    <header class="post__header">
      <p class="post__meta">
        <time :datetime="post.date">{{ formatDate(post.date) }}</time>
        <span v-if="post.readingMinutes"> · {{ post.readingMinutes }} menit baca</span>
        <span v-if="post.draft" class="badge badge--draft">Draf</span>
      </p>
      <h1>{{ post.title }}</h1>
      <ul v-if="post.tags && post.tags.length" class="tag-list">
        <li v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</li>
      </ul>
    </header>

    <div class="prose" v-html="html"></div>

    <footer class="post__footer">
      <router-link class="btn btn--ghost" :to="{ name: 'home' }">← Kembali ke daftar post</router-link>
    </footer>
  </article>

  <div v-else-if="status === 'loading'" class="muted">Memuat post…</div>

  <div v-else-if="status === 'not-found'" class="empty-state">
    <h1>Post tidak ditemukan</h1>
    <p class="muted">Post yang kamu cari tidak ada, atau masih berupa draf.</p>
    <router-link class="btn btn--primary" :to="{ name: 'home' }">Ke beranda</router-link>
  </div>

  <div v-else class="empty-state">
    <h1>Terjadi kesalahan</h1>
    <p class="alert alert--error">{{ message }}</p>
    <router-link class="btn btn--primary" :to="{ name: 'home' }">Ke beranda</router-link>
  </div>
</template>
