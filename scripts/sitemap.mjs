// Membuat sitemap.xml dan robots.txt di folder output setelah build.
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SITE_URL || 'https://blogku-theta.vercel.app').replace(/\/$/, '')
const DIST = path.resolve('dist')

const slugs = JSON.parse(fs.readFileSync('blog-posts/daftar_blog.json', 'utf8'))

const urls = ['/', ...slugs.map((slug) => `/post/${slug}`)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
</urlset>
`

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap)
fs.writeFileSync(
  path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /dashboard\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
)
console.log(`Sitemap: ${urls.length} URL → dist/sitemap.xml`)
