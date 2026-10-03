<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPost, getPublished } from '../content.js'
import { renderMarkdown } from '../markdown.js'
import { formatDate } from '../utils.js'
import { SITE_TITLE, SITE_DESCRIPTION } from '../config.js'
import { useHead } from '@unhead/vue'

const route = useRoute()
const post = ref(null)
const status = ref('loading') // loading | ok | not-found | error
const message = ref('')

function stripHeading(body) {
  // Judul sudah dirender terpisah, jadi baris "# Judul" di isi tidak diulang.
  const heading = /^\s*#\s+[^\n]*\n?/.exec(body)
  return heading ? body.slice(heading[0].length) : body
}

const html = computed(() => (post.value ? renderMarkdown(stripHeading(post.value.body)) : ''))

useHead(
  computed(() => ({
    title: post.value ? `${post.value.title} · ${SITE_TITLE}` : `Tidak ditemukan · ${SITE_TITLE}`,
    meta: [
      {
        name: 'description',
        content: post.value?.excerpt || SITE_DESCRIPTION,
      },
    ],
    script: post.value
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.value.title,
              datePublished: post.value.date,
              description: post.value.excerpt,
              keywords: (post.value.tags || []).join(', '),
            }),
          },
        ]
      : [],
  })),
)

async function load() {
  // Jangan kosongkan tampilan yang sudah terisi (menghindari kedip saat hidrasi).
  if (!post.value || post.value.slug !== route.params.slug) {
    status.value = 'loading'
    post.value = null
  }
  message.value = ''

  try {
    const data = await fetchPost(route.params.slug)
    if (!data) {
      status.value = 'not-found'
      post.value = null
      return
    }

    post.value = data
    status.value = 'ok'
  } catch (err) {
    status.value = err.status === 404 ? 'not-found' : 'error'
    message.value = err.message
  }
}

// Isi awal langsung dari bundel supaya HTML pra-render mengandung konten utuh.
const bundled = getPublished(route.params.slug)
if (bundled) {
  post.value = bundled
  status.value = 'ok'
}

// Setelah hydrasi, muat ulang (memungkinkan versi terbaru untuk yang login).
onMounted(load)
watch(() => route.params.slug, load)
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
