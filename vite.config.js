import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { postsPlugin } from './vite-plugin-posts.js'

const API_PORT = Number(process.env.PORT || 3001)

export default defineConfig({
  plugins: [vue(), postsPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
