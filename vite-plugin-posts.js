// Plugin Vite: membundel post yang sudah terbit menjadi modul virtual.
// Draf sengaja tidak ikut dibundel supaya isinya tidak bocor ke halaman publik.
import { listPosts, BLOG_DIR } from './server/posts.js'

const VIRTUAL_ID = 'virtual:published-posts'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

export function postsPlugin() {
  return {
    name: 'blog:published-posts',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null
      const posts = await listPosts({ includeDrafts: false })
      return `export default ${JSON.stringify(posts)};`
    },

    // Ubahan isinya harus langsung terlihat tanpa server.
    handleHotUpdate({ file, server }) {
      if (file.startsWith(BLOG_DIR)) {
        server.ws.send({ type: 'full-reload' })
      }
    },
  }
}
