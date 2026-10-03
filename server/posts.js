// Repositori konten: semua post dibaca/ditulis sebagai file .md di folder blog-posts/.
// Struktur per post: blog-posts/<slug>/post.md
// Metadata disimpan sebagai frontmatter opsional di bagian atas file.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export const BASE_DIR_NAME = 'blog-posts'
export const BLOG_DIR = path.resolve(here, '..', BASE_DIR_NAME)
const INDEX_FILE = path.join(BLOG_DIR, 'daftar_blog.json')
const POST_FILE = 'post.md'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/
const META_KEY_ORDER = ['title', 'date', 'excerpt', 'tags', 'draft']

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function isValidSlug(slug) {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 80 && SLUG_RE.test(slug)
}

export function slugify(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

// ---------------------------------------------------------------- frontmatter

function unquote(raw) {
  const value = raw.trim()
  if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value)
    } catch {
      return value.slice(1, -1)
    }
  }
  if (value.length > 1 && value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1)
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}

function parseFrontmatter(raw) {
  const text = String(raw).replace(/\r\n/g, '\n')
  const match = FRONTMATTER_RE.exec(text)
  if (!match) return { meta: {}, body: text }

  const meta = {}
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const sep = trimmed.indexOf(':')
    if (sep === -1) continue
    const key = trimmed.slice(0, sep).trim()
    if (key) meta[key] = unquote(trimmed.slice(sep + 1))
  }
  return { meta, body: text.slice(match[0].length) }
}

function stringifyFrontmatter(meta) {
  const keys = [
    ...META_KEY_ORDER.filter((key) => meta[key] !== undefined && meta[key] !== ''),
    ...Object.keys(meta).filter((key) => !META_KEY_ORDER.includes(key) && meta[key] !== undefined && meta[key] !== ''),
  ]
  if (keys.length === 0) return ''
  const lines = keys.map((key) => {
    const value = meta[key]
    if (typeof value === 'boolean') return `${key}: ${value}`
    return `${key}: ${JSON.stringify(String(value))}`
  })
  return `---\n${lines.join('\n')}\n---\n`
}

// ---------------------------------------------------------------- teks bantu

function firstHeading(body) {
  const match = /^#\s+(.+)$/m.exec(body)
  return match ? match[1].trim() : ''
}

function toPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}\>\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\*\*|__|\*|_/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeExcerpt(markdown, maxLength = 160) {
  // Judul tidak ikut dihitung supaya ringkasan langsung mulai dari isi.
  const text = toPlainText(markdown.replace(/^\s*#\s+[^\n]*\n?/, ''))
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

function readingStats(markdown) {
  const text = toPlainText(markdown)
  const words = text ? text.split(/\s+/).length : 0
  return { words, readingMinutes: Math.max(1, Math.round(words / 200)) }
}

function cleanLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags ?? '').split(',')
  const result = []
  for (const item of list) {
    const tag = cleanLine(item)
    if (tag && !result.includes(tag)) result.push(tag)
  }
  return result
}

function formatDate(date) {
  const value = String(date ?? '')
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : value.slice(0, 10)
}

// Pastikan isi post selalu diawali "# Judul", supaya judul tampil konsisten.
function ensureHeading(body, title) {
  const text = String(body ?? '').replace(/\r\n/g, '\n').trim()
  if (!text) return `# ${title}`
  if (/^#\s+/.test(text)) return text.replace(/^#\s+[^\n]*/, () => `# ${title}`)
  return `# ${title}\n\n${text}`
}

async function atomicWrite(file, data) {
  const temp = `${file}.${process.pid}.tmp`
  await fs.writeFile(temp, data, 'utf8')
  await fs.rename(temp, file)
}

function postPath(slug) {
  if (!isValidSlug(slug)) throw new HttpError(400, 'Slug tidak valid.')
  return path.join(BLOG_DIR, slug, POST_FILE)
}

// ---------------------------------------------------------------- read

// Ubah isi mentah satu post.md menjadi objek post.
// Dipakai bersama oleh penyimpanan lokal maupun GitHub.
export function buildPost(slug, raw, { updatedAt = null } = {}) {
  const { meta, body } = parseFrontmatter(raw)
  const title = cleanLine(meta.title) || firstHeading(body) || slug
  const fallbackDate = updatedAt ? String(updatedAt).slice(0, 10) : new Date().toISOString().slice(0, 10)
  const date = cleanLine(meta.date) ? formatDate(meta.date) : fallbackDate
  const tags = normalizeTags(meta.tags)
  const stats = readingStats(body)

  return {
    slug,
    title,
    date,
    excerpt: cleanLine(meta.excerpt) || makeExcerpt(body),
    tags,
    draft: meta.draft === true || meta.draft === 'true',
    body,
    updatedAt,
    words: stats.words,
    readingMinutes: stats.readingMinutes,
  }
}

export async function readPost(slug) {
  if (!isValidSlug(slug)) return null
  const file = postPath(slug)

  let raw
  try {
    raw = await fs.readFile(file, 'utf8')
  } catch {
    return null
  }

  const stat = await fs.stat(file)
  return buildPost(slug, raw, { updatedAt: stat.mtime.toISOString() })
}

export async function listPosts({ includeDrafts = false } = {}) {
  let entries
  try {
    entries = await fs.readdir(BLOG_DIR, { withFileTypes: true })
  } catch {
    return []
  }

  const posts = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const post = await readPost(entry.name)
    if (post) posts.push(post)
  }

  return selectPosts(posts, { includeDrafts })
}

// Saring draf lalu urutkan terbaru lebih dulu (dipakai dua penyimpanan).
export function selectPosts(posts, { includeDrafts = false } = {}) {
  const list = posts.filter((post) => post && (includeDrafts || !post.draft))
  list.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.slug < b.slug ? -1 : 1
  })
  return list
}

// Validasi input dashboard menjadi payload siap tulis (dipakai dua penyimpanan).
export function toPayload(input, { fallbackSlug = null, fallbackDate = '' } = {}) {
  const title = cleanLine(input.title)
  if (!title) throw new HttpError(400, 'Judul wajib diisi.')

  const slug = isValidSlug(input.slug) ? input.slug : fallbackSlug || slugify(title)
  if (!isValidSlug(slug)) {
    throw new HttpError(400, 'Slug tidak valid. Gunakan huruf kecil, angka, dan tanda minus.')
  }

  return {
    slug,
    title,
    date: cleanLine(input.date) || fallbackDate || new Date().toISOString().slice(0, 10),
    excerpt: input.excerpt ?? '',
    tags: input.tags ?? [],
    draft: input.draft === true,
    body: String(input.body ?? ''),
  }
}

// Isi daftar_blog.json dari daftar slug (dipakai penyimpanan lokal & GitHub).
export function buildIndexFile(slugs) {
  return `${JSON.stringify([...slugs].sort(), null, 2)}\n`
}

// Menjaga daftar_blog.json tetap sinkron dengan isi folder.
async function syncIndex() {
  const posts = await listPosts({ includeDrafts: true })
  await atomicWrite(INDEX_FILE, buildIndexFile(posts.map((post) => post.slug)))
}

// ---------------------------------------------------------------- write

export function buildFile({ title, date, excerpt, tags, draft, body }) {
  const meta = { title, date: cleanLine(date) }
  const cleanExcerpt = cleanLine(excerpt)
  if (cleanExcerpt) meta.excerpt = cleanExcerpt
  const cleanTags = normalizeTags(tags)
  if (cleanTags.length) meta.tags = cleanTags.join(', ')
  if (draft) meta.draft = true
  return `${stringifyFrontmatter(meta)}${ensureHeading(body, title)}\n`
}

export async function createPost(input) {
  const payload = toPayload(input)
  const dir = path.join(BLOG_DIR, payload.slug)

  try {
    await fs.access(path.join(dir, POST_FILE))
    throw new HttpError(409, `Post dengan slug "${payload.slug}" sudah ada.`)
  } catch (err) {
    if (err instanceof HttpError) throw err
  }

  await fs.mkdir(dir, { recursive: true })
  await atomicWrite(path.join(dir, POST_FILE), buildFile(payload))
  await syncIndex()

  const post = await readPost(payload.slug)
  if (!post) throw new HttpError(500, 'Post gagal disimpan.')
  return post
}

export async function updatePost(oldSlug, input) {
  if (!isValidSlug(oldSlug)) throw new HttpError(400, 'Slug tidak valid.')
  const existing = await readPost(oldSlug)
  if (!existing) throw new HttpError(404, 'Post tidak ditemukan.')

  const payload = toPayload(input, { fallbackSlug: oldSlug, fallbackDate: existing.date })
  const targetDir = path.join(BLOG_DIR, payload.slug)
  const targetFile = path.join(targetDir, POST_FILE)

  if (payload.slug !== oldSlug) {
    try {
      await fs.access(targetFile)
      throw new HttpError(409, `Post dengan slug "${payload.slug}" sudah ada.`)
    } catch (err) {
      if (err instanceof HttpError) throw err
    }
    await fs.mkdir(targetDir, { recursive: true })
    await atomicWrite(targetFile, buildFile(payload))
    await fs.rm(path.join(BLOG_DIR, oldSlug), { recursive: true, force: true })
  } else {
    await atomicWrite(targetFile, buildFile(payload))
  }

  await syncIndex()

  const post = await readPost(payload.slug)
  if (!post) throw new HttpError(500, 'Post gagal disimpan.')
  return post
}

export async function deletePost(slug) {
  if (!isValidSlug(slug)) throw new HttpError(400, 'Slug tidak valid.')
  const existing = await readPost(slug)
  if (!existing) throw new HttpError(404, 'Post tidak ditemukan.')

  await fs.rm(path.join(BLOG_DIR, slug), { recursive: true, force: true })
  await syncIndex()
  return existing
}
