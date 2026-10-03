<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { renderMarkdown } from '../markdown.js'
import { slugify, SLUG_RE, today } from '../utils.js'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const flash = ref('')
const slugTouched = ref(false)

const form = reactive({
  title: '',
  slug: '',
  date: today(),
  excerpt: '',
  tags: '',
  draft: false,
  body: '',
})

const isEdit = computed(() => route.name === 'post-edit')
const slugValid = computed(() => !form.slug || SLUG_RE.test(form.slug))
const paneMode = ref('edit') // 'edit' | 'preview'
const previewHtml = computed(() => renderMarkdown(form.body))
const wordCount = computed(() => {
  const text = form.body.trim()
  return text ? text.split(/\s+/).length : 0
})

function resetForm() {
  form.title = ''
  form.slug = ''
  form.date = today()
  form.excerpt = ''
  form.tags = ''
  form.draft = false
  form.body = ''
  slugTouched.value = false
}

async function load() {
  error.value = ''
  const slug = route.params.slug

  if (!slug) {
    resetForm()
    return
  }

  loading.value = true
  try {
    const { post } = await api.getPost(slug)
    form.title = post.title
    form.slug = post.slug
    form.date = post.date
    form.excerpt = post.excerpt
    form.tags = post.tags.join(', ')
    form.draft = post.draft
    form.body = post.body
    slugTouched.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Dipanggil saat rute berganti, misal dari "tulis" ke "ubah" setelah post dibuat.
watch(() => `${route.name}:${route.params.slug ?? ''}`, load, { immediate: true })

// Slug ikut judul, sampai kamu mengeditnya sendiri.
watch(
  () => form.title,
  (value) => {
    if (slugTouched.value) return
    form.slug = slugify(value)
  },
)

function showFlash(message) {
  flash.value = message
  setTimeout(() => {
    if (flash.value === message) flash.value = ''
  }, 2500)
}

async function save() {
  if (saving.value) return
  error.value = ''

  if (!form.title.trim()) {
    error.value = 'Judul wajib diisi.'
    return
  }
  const slug = form.slug.trim() || slugify(form.title)
  if (!SLUG_RE.test(slug)) {
    error.value = 'Slug tidak valid. Gunakan huruf kecil, angka, dan tanda minus.'
    return
  }

  const payload = {
    slug,
    title: form.title,
    date: form.date || today(),
    excerpt: form.excerpt,
    tags: form.tags,
    draft: form.draft,
    body: form.body,
  }

  saving.value = true
  try {
    if (isEdit.value) {
      const { post } = await api.updatePost(route.params.slug, payload)
      if (post.slug !== route.params.slug) {
        router.replace({ name: 'post-edit', params: { slug: post.slug } })
      }
      showFlash('Perubahan tersimpan.')
    } else {
      const { post } = await api.createPost(payload)
      router.replace({ name: 'post-edit', params: { slug: post.slug } })
      showFlash('Post dibuat.')
    }
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!isEdit.value) return
  const ok = window.confirm(`Hapus post "${form.title}"?\n\nFile .md-nya akan ikut terhapus.`)
  if (!ok) return
  try {
    await api.deletePost(route.params.slug)
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.message
  }
}

function onKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    save()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="editor-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1>{{ isEdit ? 'Ubah post' : 'Tulis post baru' }}</h1>
      </div>
      <div class="page-head__actions">
        <router-link class="btn btn--ghost" :to="{ name: 'dashboard' }">Kembali</router-link>
        <button class="btn btn--primary" type="button" :disabled="saving || loading" @click="save">
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="alert alert--error">{{ error }}</p>
    <p v-if="flash" class="alert alert--ok">{{ flash }}</p>

    <p v-if="loading" class="muted">Memuat post…</p>

    <form v-else class="editor" @submit.prevent="save">
      <div class="editor__fields">
        <div class="field">
          <label for="judul">Judul</label>
          <input id="judul" v-model="form.title" type="text" placeholder="Judul post" required />
          <p class="field__help">Baris pertama isi post akan otomatis disamakan dengan judul.</p>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="slug">Slug</label>
            <input
              id="slug"
              v-model="form.slug"
              type="text"
              placeholder="judul-post"
              @input="slugTouched = true"
            />
            <p class="field__help">Tautan: <code>/post/{{ form.slug || 'slug' }}</code></p>
            <p v-if="!slugValid" class="field__error">
              Hanya boleh huruf kecil, angka, dan tanda minus.
            </p>
          </div>

          <div class="field">
            <label for="tanggal">Tanggal</label>
            <input id="tanggal" v-model="form.date" type="date" />
          </div>
        </div>

        <div class="field">
          <label for="tags">Tag</label>
          <input id="tags" v-model="form.tags" type="text" placeholder="vue, markdown, tutorial" />
          <p class="field__help">Pisahkan dengan koma.</p>
        </div>

        <div class="field">
          <label for="excerpt">Ringkasan</label>
          <textarea
            id="excerpt"
            v-model="form.excerpt"
            rows="2"
            placeholder="Kutipan singkat untuk daftar post (opsional)"
          ></textarea>
        </div>

        <label class="checkbox">
          <input v-model="form.draft" type="checkbox" />
          <span>Simpan sebagai draf (tidak tampil di halaman utama)</span>
        </label>
      </div>

      <div class="editor__panes">
        <div class="editor__tabs">
          <button
            type="button"
            class="tab"
            :class="{ 'tab--active': paneMode === 'edit' }"
            @click="paneMode = 'edit'"
          >
            Tulis
          </button>
          <button
            type="button"
            class="tab"
            :class="{ 'tab--active': paneMode === 'preview' }"
            @click="paneMode = 'preview'"
          >
            Pratinjau
          </button>
        </div>

        <div v-show="paneMode === 'edit'" class="pane">
          <div class="pane__head">
            <span>Markdown</span>
            <span class="muted">{{ wordCount }} kata</span>
          </div>
          <textarea
            v-model="form.body"
            class="pane__body"
            placeholder="# Judul&#10;&#10;Tulis isi post di sini…"
            spellcheck="true"
          ></textarea>
        </div>

        <div v-show="paneMode === 'preview'" class="pane">
          <div class="pane__head">
            <span>Pratinjau</span>
          </div>
          <div class="pane__body prose" v-html="previewHtml"></div>
        </div>
      </div>

      <div class="editor__footer">
        <button class="btn btn--primary" type="submit" :disabled="saving">
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
        <button v-if="isEdit" class="btn btn--danger" type="button" @click="remove">
          Hapus post
        </button>
        <span class="muted">Ctrl+S untuk menyimpan</span>
      </div>
    </form>
  </div>
</template>
