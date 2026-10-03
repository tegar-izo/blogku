// Uji driver penyimpanan GitHub terhadap mock GitHub API.
// Jalankan dengan: npm test
import http from 'node:http'
import fs from 'node:fs'
import assert from 'node:assert'

// --------------------------------------------------------------- mock
const files = new Map() // path -> isi string
const state = { commit: 'c1', tree: 't1', requests: 0, unauthorized: 0 }

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function dirEntries(prefix) {
  // prefix seperti 'blog-posts/'
  const out = new Map()
  for (const path of files.keys()) {
    if (!path.startsWith(prefix)) continue
    const rest = path.slice(prefix.length)
    const slash = rest.indexOf('/')
    if (slash === -1) {
      out.set(rest, { name: rest, path: prefix + rest, type: 'file' })
    } else {
      const name = rest.slice(0, slash)
      out.set(name, { name, path: prefix + name, type: 'dir' })
    }
  }
  return [...out.values()].map((entry) => ({
    ...entry,
    sha: 'sha-' + entry.path,
    ...(entry.type === 'file'
      ? { content: Buffer.from(files.get(entry.path)).toString('base64'), encoding: 'base64' }
      : {}),
  }))
}

const server = http.createServer((req, res) => {
  state.requests++
  const url = new URL(req.url, 'http://localhost')
  const p = url.pathname

  if (req.headers.authorization !== 'Bearer token-uji') {
    state.unauthorized++
    return json(res, 401, { message: 'Bad credentials' })
  }

  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    const payload = body ? JSON.parse(body) : null

    // Contents API
    if (p.startsWith('/repos/o/r/contents/')) {
      const rel = decodeURIComponent(p.slice('/repos/o/r/contents/'.length))
      if (req.method === 'GET') {
        if (files.has(rel)) {
          return json(res, 200, {
            type: 'file',
            path: rel,
            sha: 'sha-' + rel,
            content: Buffer.from(files.get(rel)).toString('base64'),
            encoding: 'base64',
          })
        }
        // daftar direktori?
        const prefix = rel.endsWith('/') ? rel : rel + '/'
        const entries = dirEntries(prefix)
        if (entries.length) return json(res, 200, entries)
        return json(res, 404, { message: 'Not Found' })
      }
    }

    // Git Data API
    if (p === '/repos/o/r/git/ref/heads/main') {
      return json(res, 200, { ref: 'refs/heads/main', object: { sha: state.commit } })
    }
    if (p === `/repos/o/r/git/commits/${state.commit}`) {
      return json(res, 200, { sha: state.commit, tree: { sha: state.tree } })
    }
    if (p === '/repos/o/r/git/trees' && req.method === 'POST') {
      for (const entry of payload.tree) {
        if (entry.sha === null) files.delete(entry.path)
        else if (typeof entry.content === 'string') files.set(entry.path, entry.content)
      }
      state.tree = 't-' + Math.random().toString(36).slice(2, 8)
      return json(res, 201, { sha: state.tree })
    }
    if (p === '/repos/o/r/git/commits' && req.method === 'POST') {
      state.commit = 'c-' + Math.random().toString(36).slice(2, 8)
      return json(res, 201, { sha: state.commit, message: payload.message })
    }
    if (p === '/repos/o/r/git/refs/heads/main' && req.method === 'PATCH') {
      return json(res, 200, { ref: 'refs/heads/main', object: { sha: payload.sha } })
    }

    return json(res, 404, { message: 'Not Found: ' + p })
  })
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port

// --------------------------------------------------------------- env
process.env.GITHUB_TOKEN = 'token-uji'
process.env.GITHUB_REPOSITORY = 'o/r'
process.env.GITHUB_BRANCH = 'main'
process.env.GITHUB_API_URL = `http://127.0.0.1:${port}`
delete process.env.VERCEL

// Benih: pakai isi post asli dari repo.
files.set('blog-posts/apa-itu-pfp/post.md', fs.readFileSync('blog-posts/apa-itu-pfp/post.md', 'utf8'))
files.set('blog-posts/daftar_blog.json', '["apa-itu-pfp"]\n')

const results = []
let failed = 0
const check = (label, cond, extra = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : '  -> ' + extra}`)
  if (!cond) failed++
}

try {
  const storage = await import('../server/content.js')

  const before = state.requests
  const list = await storage.listPosts({ includeDrafts: true })
  check('membaca daftar lewat API', list.length === 1 && list[0].slug === 'apa-itu-pfp', JSON.stringify(list))
  check('mengirim token', state.unauthorized === 0)

  const detail = await storage.readPost('apa-itu-pfp')
  check('detail post terbaca', detail?.title === 'apa itu pfp', JSON.stringify(detail?.title))
  check('slug tak dikenal -> null', (await storage.readPost('tidak-ada')) === null)

  // --- buat ---
  const created = await storage.createPost({
    slug: 'post-dari-github',
    title: 'Post Dari GitHub',
    date: '2026-10-03',
    tags: 'vercel, uji',
    body: 'Isi post baru.',
  })
  check('create mengembalikan post', created.slug === 'post-dari-github', JSON.stringify(created))
  check(
    'file .md masuk repo',
    files.has('blog-posts/post-dari-github/post.md') &&
      files.get('blog-posts/post-dari-github/post.md').includes('# Post Dari GitHub'),
  )
  check(
    'daftar_blog.json ikut di-commit',
    JSON.parse(files.get('blog-posts/daftar_blog.json')).join(',') ===
      'apa-itu-pfp,post-dari-github',
    files.get('blog-posts/daftar_blog.json'),
  )
  const commitsAfterCreate = [...files.keys()].length

  // --- duplikat ---
  let dupError = ''
  try {
    await storage.createPost({ slug: 'post-dari-github', title: 'Duplikat', body: 'x' })
  } catch (err) {
    dupError = err.message
  }
  check('slug kembar ditolak 409', dupError.includes('sudah ada'), dupError)

  // --- ubah + ganti slug ---
  const updated = await storage.updatePost('post-dari-github', {
    slug: 'post-diubah',
    title: 'Post Diubah',
    date: '2026-10-03',
    body: 'Isi sudah diubah.',
    draft: true,
  })
  check('rename bekerja', updated.slug === 'post-diubah' && updated.draft === true, JSON.stringify(updated))
  check('file lama terhapus', !files.has('blog-posts/post-dari-github/post.md'))
  check('file baru ada', files.has('blog-posts/post-diubah/post.md'))
  check(
    'index mengikuti rename',
    JSON.parse(files.get('blog-posts/daftar_blog.json')).join(',') === 'apa-itu-pfp,post-diubah',
    files.get('blog-posts/daftar_blog.json'),
  )
  const draftList = await storage.listPosts({ includeDrafts: false })
  check('draf disembunyikan', draftList.length === 1 && draftList[0].slug === 'apa-itu-pfp', JSON.stringify(draftList))

  // --- 404 saat ubah post yang tidak ada ---
  let missing = ''
  try {
    await storage.updatePost('tak-ada', { title: 'X', body: 'y' })
  } catch (err) {
    missing = err.message
  }
  check('post tak dikenal -> 404', missing.includes('tidak ditemukan'), missing)

  // --- hapus ---
  const deleted = await storage.deletePost('post-diubah')
  check('hapus mengembalikan post', deleted.slug === 'post-diubah')
  check('file terhapus dari repo', !files.has('blog-posts/post-diubah/post.md'))
  check(
    'index bersih',
    JSON.parse(files.get('blog-posts/daftar_blog.json')).join(',') === 'apa-itu-pfp',
    files.get('blog-posts/daftar_blog.json'),
  )

  // --- konfigurasi belum lengkap ---
  delete process.env.GITHUB_TOKEN
  let cfgError = ''
  try {
    await storage.listPosts()
  } catch (err) {
    cfgError = err.message
  }
  check('tanpa token -> pesan jelas', cfgError.includes('GITHUB_TOKEN'), cfgError)

  check('jumlah panggilan API wajar', state.requests - before < 40, String(state.requests - before))
} catch (err) {
  failed++
  results.push(`FAIL  crash: ${err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : err}`)
}

server.close()
console.log(results.join('\n'))
console.log(failed ? `\n${failed} pemeriksaan gagal` : '\nSemua pemeriksaan lulus')
process.exit(failed ? 1 : 0)
