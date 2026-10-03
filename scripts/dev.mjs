// Menjalankan server API + Vite dev server bersamaan lewat satu perintah: npm run dev
import { spawn } from 'node:child_process'

const children = []
let shuttingDown = false

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })

  child.on('error', (err) => {
    console.error(`\n[${name}] gagal dijalankan: ${err.message}`)
    shutdown(1)
  })

  child.on('exit', (code) => {
    if (shuttingDown) return
    console.log(`\n[${name}] berhenti (kode ${code ?? 0})`)
    shutdown(code ?? 0)
  })

  children.push(child)
}

function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    try {
      child.kill('SIGTERM')
    } catch {
      // abaikan
    }
  }
  process.exit(code)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0))
}

console.log('Menjalankan server API (http://localhost:3001) dan Vite (http://localhost:5173)...\n')
run('server', process.execPath, ['server/index.js'])
run('client', 'vite-ssg', ['dev'])
