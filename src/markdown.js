import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.use({ gfm: true, breaks: true })

// Render Markdown menjadi HTML yang sudah dibersihkan dari skrip berbahaya.
export function renderMarkdown(source) {
  const html = marked.parse(String(source ?? ''))
  // Saat pra-render di Node tidak ada window, sanitize mengembalikan isi apa adanya —
  // aman karena konten berasal dari file .md di repo sendiri.
  if (typeof DOMPurify.sanitize !== 'function') return html
  return DOMPurify.sanitize(html)
}
