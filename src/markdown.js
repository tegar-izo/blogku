import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.use({ gfm: true, breaks: true })

// Render Markdown menjadi HTML yang sudah dibersihkan dari skrip berbahaya.
export function renderMarkdown(source) {
  const html = marked.parse(String(source ?? ''))
  return DOMPurify.sanitize(html)
}
