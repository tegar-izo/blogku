// Aplikasi Express — dipakai dua cara:
// - lokal:    server/index.js (app.listen)
// - Vercel:   api/*.js         (diekspor sebagai serverless function)
import './env.js'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpError } from './posts.js'
import { listPosts, readPost, createPost, updatePost, deletePost } from './content.js'
import { authMiddleware, requireAuth, getSessionInfo, login, logout } from './auth.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const quiet = Boolean(process.env.VERCEL)

// Bungkus handler async supaya error masuk ke error handler (Express 4 maupun 5).
const h = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))

// Vercel meneruskan path API tanpa awalan /api (/posts bukan /api/posts).
// Samakan dulu SEBELUM yang lain supaya rute cukup ditulis sekali.
const API_PATH_RE = /^\/(health|login|logout|me|posts)(\/|\?|$)/
app.use((req, _res, next) => {
  if (!req.path.startsWith('/api') && API_PATH_RE.test(req.path)) {
    req.url = `/api${req.url}`
  }
  next()
})

// --- sajikan hasil build (hanya untuk pemakaian lokal) ---
const distDir = path.resolve(here, '..', 'dist')
const indexHtml = path.join(distDir, 'index.html')
const hasDist = fs.existsSync(indexHtml)
if (hasDist) {
  app.use(express.static(distDir))
  // SPA fallback: semua GET non-API jatuh ke index.html.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(indexHtml)
  })
}
if (!quiet) {
  console.log(hasDist ? `Menyajikan build statis dari ${distDir}` : 'Folder dist/ belum ada — jalankan `npm run build` untuk mode produksi.')
}

// --- rute API ---
// Semua request /api harus sudah punya info sesi sebelum diproses.
app.use('/api', authMiddleware)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/login', h(login))
app.post('/api/logout', h(logout))
app.get('/api/me', (req, res) => {
  res.json(getSessionInfo(req))
})

// --- daftar post ---
app.get(
  '/api/posts',
  h(async (req, res) => {
    const scopeAll = req.query.scope === 'all'
    if (scopeAll && !req.auth?.authenticated) {
      throw new HttpError(401, 'Silakan masuk ke dashboard terlebih dahulu.')
    }
    const posts = await listPosts({ includeDrafts: scopeAll })
    res.json({ posts: posts.map(({ body, ...meta }) => meta) })
  }),
)

// --- detail post ---
app.get(
  '/api/posts/:slug',
  h(async (req, res) => {
    const post = await readPost(req.params.slug)
    if (!post || (post.draft && !req.auth?.authenticated)) {
      throw new HttpError(404, 'Post tidak ditemukan.')
    }
    res.json({ post })
  }),
)

// --- buat post ---
app.post(
  '/api/posts',
  requireAuth,
  h(async (req, res) => {
    const post = await createPost(req.body ?? {})
    res.status(201).json({ post })
  }),
)

// --- ubah post ---
app.put(
  '/api/posts/:slug',
  requireAuth,
  h(async (req, res) => {
    const post = await updatePost(req.params.slug, req.body ?? {})
    res.json({ post })
  }),
)

// --- hapus post ---
app.delete(
  '/api/posts/:slug',
  requireAuth,
  h(async (req, res) => {
    const post = await deletePost(req.params.slug)
    res.json({ post })
  }),
)

// 404 untuk semua endpoint /api yang tidak dikenal.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' })
})

// --- error handler ---
app.use((err, req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Body JSON tidak valid.' })
    return
  }

  const status = err instanceof HttpError ? err.status : err.status || 500
  if (status >= 500 && !quiet) console.error(err)

  // Pesan dari HttpError aman ditampilkan (mis. konfigurasi GitHub yang belum lengkap);
  // error tak dikenal disembunyikan supaya detail internal tidak bocor.
  let message
  if (err instanceof HttpError) message = err.message
  else if (status >= 500) message = 'Terjadi kesalahan di server.'
  else message = err.message || 'Permintaan gagal.'
  if (req.path.startsWith('/api')) {
    res.status(status).json({ error: message })
    return
  }
  res.status(status).type('text/plain').send(message)
})

export default app
