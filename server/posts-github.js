// Penyimpanan konten lewat GitHub API.
// Dipakai saat berjalan di Vercel: filesystem-nya read-only dan hilang setiap
// deploy, jadi file .md disimpan di repo GitHub dan di-commit lewat API.
import {
  HttpError,
  isValidSlug,
  BASE_DIR_NAME,
  buildFile,
  buildPost,
  buildIndexFile,
  selectPosts,
  toPayload,
} from './posts.js'

const POST_FILE = 'post.md'
const INDEX_FILE = 'daftar_blog.json'
const API_URL = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/+$/, '')

function config() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new HttpError(
      500,
      'GITHUB_TOKEN belum diatur. Setel Environment Variables GITHUB_TOKEN (skop contents: write) di Vercel.',
    )
  }

  // Pemilik repo: env eksplisit → GITHUB_REPOSITORY → info bawaan Vercel.
  let owner = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER || ''
  let name = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG || ''
  const repository = process.env.GITHUB_REPOSITORY || ''
  if ((!owner || !name) && repository.includes('/')) {
    ;[owner, name] = repository.split('/')
  }
  if (!owner || !name) {
    throw new HttpError(
      500,
      'Repo GitHub belum diketahui. Setel GITHUB_REPOSITORY (owner/nama-repo) atau GITHUB_OWNER + GITHUB_REPO.',
    )
  }

  return {
    token,
    owner,
    name,
    branch: process.env.GITHUB_BRANCH || 'main',
  }
}

function repoPath(cfg, suffix) {
  return `/repos/${cfg.owner}/${cfg.name}${suffix}`
}

function githubError(res, data) {
  const detail = data?.message || res.statusText || 'tanpa pesan'
  if (res.status === 401 || res.status === 403) {
    return new HttpError(
      502,
      `GitHub menolak akses (${detail}). Periksa GITHUB_TOKEN dan skop "contents: write".`,
    )
  }
  if (res.status === 404) {
    return new HttpError(502, 'Repo GitHub tidak ditemukan. Periksa GITHUB_REPOSITORY.')
  }
  if (res.status === 409) return new HttpError(409, 'File sudah ada di GitHub.')
  if (res.status === 422) return new HttpError(400, detail)
  if (res.status === 429) return new HttpError(429, 'Kena limit rate GitHub API. Coba lagi sebentar.')
  return new HttpError(502, `GitHub API gagal (${res.status}): ${detail}`)
}

async function request(path, { method = 'GET', body, allow404 = false } = {}) {
  const cfg = config()
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vue-md-blog',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (allow404 && res.status === 404) return null

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) throw githubError(res, data)
  return data
}

// ---------------------------------------------------------------- read

async function fetchFile(relativePath) {
  const cfg = config()
  const file = await request(repoPath(cfg, `/contents/${relativePath}?ref=${cfg.branch}`), {
    allow404: true,
  })
  if (!file || file.type !== 'file') return null

  // File >1MB tidak menyertakan isi di respons Contents API.
  if (!file.content && file.download_url) {
    const res = await fetch(file.download_url, {
      headers: { Authorization: `Bearer ${cfg.token}`, 'User-Agent': 'vue-md-blog' },
    })
    if (!res.ok) throw githubError(res, null)
    return await res.text()
  }

  return Buffer.from(String(file.content ?? '').replace(/\n/g, ''), 'base64').toString('utf8')
}

export async function readPost(slug) {
  if (!isValidSlug(slug)) return null
  const raw = await fetchFile(`${BASE_DIR_NAME}/${slug}/${POST_FILE}`)
  if (raw === null) return null
  return buildPost(slug, raw, { updatedAt: null })
}

async function listSlugs() {
  const cfg = config()
  const entries = await request(repoPath(cfg, `/contents/${BASE_DIR_NAME}?ref=${cfg.branch}`), {
    allow404: true,
  })
  if (!Array.isArray(entries)) return []
  return entries
    .filter((entry) => entry.type === 'dir' && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
}

export async function listPosts({ includeDrafts = false } = {}) {
  const slugs = await listSlugs()
  const posts = await Promise.all(slugs.map((slug) => readPost(slug)))
  return selectPosts(posts, { includeDrafts })
}

// ---------------------------------------------------------------- write

// Satu aksi = satu commit (file post + daftar_blog.json) lewat Git Data API,
// supaya riwayat repo tetap rapi.
async function commitChanges(changes, message) {
  const cfg = config()

  // Dicoba dua kali: kalau ada push bersamaan saat pembacaan, commit diulang
  // dengan basis terbaru.
  let lastError
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ref = await request(repoPath(cfg, `/git/ref/heads/${cfg.branch}`))
      const base = await request(repoPath(cfg, `/git/commits/${ref.object.sha}`))
      const tree = await request(repoPath(cfg, '/git/trees'), {
        method: 'POST',
        body: {
          base_tree: base.tree.sha,
          tree: changes.map((change) =>
            change.content === null || change.content === undefined
              ? { path: change.path, mode: '100644', type: 'blob', sha: null }
              : { path: change.path, mode: '100644', type: 'blob', content: change.content },
          ),
        },
      })
      const commit = await request(repoPath(cfg, '/git/commits'), {
        method: 'POST',
        body: { message, tree: tree.sha, parents: [base.sha] },
      })
      await request(repoPath(cfg, `/git/refs/heads/${cfg.branch}`), {
        method: 'PATCH',
        body: { sha: commit.sha },
      })
      return commit
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

function postPath(slug) {
  return `${BASE_DIR_NAME}/${slug}/${POST_FILE}`
}

function indexPath() {
  return `${BASE_DIR_NAME}/${INDEX_FILE}`
}

export async function createPost(input) {
  const payload = toPayload(input)
  const slugs = await listSlugs()

  if (slugs.includes(payload.slug)) {
    throw new HttpError(409, `Post dengan slug "${payload.slug}" sudah ada.`)
  }

  await commitChanges(
    [
      { path: postPath(payload.slug), content: buildFile(payload) },
      { path: indexPath(), content: buildIndexFile([...slugs, payload.slug]) },
    ],
    `Tambah post ${payload.slug}`,
  )

  const post = await readPost(payload.slug)
  if (!post) throw new HttpError(500, 'Post gagal disimpan.')
  return post
}

export async function updatePost(oldSlug, input) {
  if (!isValidSlug(oldSlug)) throw new HttpError(400, 'Slug tidak valid.')
  const existing = await readPost(oldSlug)
  if (!existing) throw new HttpError(404, 'Post tidak ditemukan.')

  const payload = toPayload(input, { fallbackSlug: oldSlug, fallbackDate: existing.date })
  const slugs = await listSlugs()
  const renamed = payload.slug !== oldSlug

  if (renamed && slugs.includes(payload.slug)) {
    throw new HttpError(409, `Post dengan slug "${payload.slug}" sudah ada.`)
  }

  const changes = []
  if (renamed) changes.push({ path: postPath(oldSlug), content: null })
  changes.push({ path: postPath(payload.slug), content: buildFile(payload) })
  changes.push({
    path: indexPath(),
    content: buildIndexFile(slugs.map((slug) => (slug === oldSlug ? payload.slug : slug))),
  })

  await commitChanges(changes, `Ubah post ${payload.slug}`)

  const post = await readPost(payload.slug)
  if (!post) throw new HttpError(500, 'Post gagal disimpan.')
  return post
}

export async function deletePost(slug) {
  if (!isValidSlug(slug)) throw new HttpError(400, 'Slug tidak valid.')
  const existing = await readPost(slug)
  if (!existing) throw new HttpError(404, 'Post tidak ditemukan.')

  const slugs = await listSlugs()
  await commitChanges(
    [
      { path: postPath(slug), content: null },
      { path: indexPath(), content: buildIndexFile(slugs.filter((item) => item !== slug)) },
    ],
    `Hapus post ${slug}`,
  )

  return existing
}
