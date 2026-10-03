// Entry lokal: menjalankan aplikasi Express di port biasa.
// Untuk Vercel, gunakan api/index.js (serverless) — jangan file ini.
import './env.js'
import app from './app.js'

const PORT = Number(process.env.PORT || 3001)

app.listen(PORT, () => {
  console.log(`Server API berjalan di http://localhost:${PORT}`)
  console.log(
    process.env.GITHUB_TOKEN || process.env.VERCEL
      ? 'Penyimpanan: GitHub API'
      : 'Penyimpanan: folder blog-posts/',
  )
})
