# Blog Vue + Dashboard

Web app untuk membaca dan mengelola blog yang kontennya disimpan sebagai file **Markdown (`.md`)** di dalam folder. Dibangun dengan **Vue 3 + Vite**, dilengkapi **dashboard** untuk membuat, mengubah, dan menghapus post, plus **deploy ke Vercel** yang menyimpan setiap post ke repository GitHub.

```
blog-posts/
├── daftar_blog.json          # daftar slug (otomatis disinkronkan)
├── apa-itu-pfp/
│   └── post.md               # satu post = satu folder
└── kenapa-skibidi-rizz-itu-op/
    └── post.md
```

## Fitur

- **Halaman publik**: daftar post, halaman baca post, rendering Markdown (GFM + line break), sanitasi HTML.
- **Dashboard** (`/dashboard`): statistik, daftar semua post, tulis/ubah/hapus post.
- **Editor**: dua pane (Markdown + pratinjau langsung), auto-slug dari judul, tag, tanggal, ringkasan, penanda draf, simpan dengan `Ctrl+S`.
- **Konten tetap file `.md`**: semua perubahan dashboard langsung menjadi file Markdown, jadi bisa di-commit dan dibaca orang lain.
- **Draf**: post berstatus draf tidak tampil di halaman publik dan **tidak ikut dibundel** ke browser.
- **Autentikasi sederhana**: satu password lewat `DASHBOARD_PASSWORD`, sesi berupa cookie `httpOnly`.
- **Tema terang/gelap** otomatis mengikuti sistem, tampilan responsif.

## Menjalankan

> Prasyarat: Node.js 20.19+ (dites dengan Node 26) dan npm.

```bash
npm install

# mode pengembangan: server API (3001) + Vite (5173) sekaligus
npm run dev
# buka http://localhost:5173
```

Mode produksi lokal:

```bash
npm run build   # hasilnya di folder dist/
npm start       # server menyajikan dist/ + API di http://localhost:3001
```

Perintah lain: `npm test` (uji driver penyimpanan GitHub), `npm run dev:server`, `npm run dev:client`, `npm run preview`.

## Deploy ke Vercel

Di Vercel tidak ada folder yang bisa ditulis (filesystem read-only dan hilang tiap deploy), jadi setiap post yang disimpan dashboard **di-commit ke repository GitHub lewat GitHub API**. Repo-lah yang jadi sumber konten, dan Vercel otomatis build ulang dari commit itu.

Alurnya:

```
Simpan di dashboard  →  server commit .md ke repo  →  Vercel build ulang  →  post tayang
```

### 1. Taruh kode di GitHub

Semua file ini belum di-commit. Dorong dulu ke `github.com/tegar-izo/blogku`:

```bash
git add -A
git commit -m "Tambah web app blog + dashboard"
git push
```

### 2. Sambungkan proyek di Vercel

Buka [vercel.com/new](https://vercel.com/new), impor repository `tegar-izo/blogku`, lalu Deploy.
Konfigurasi build sudah ada di `vercel.json` (`npm run build` → folder `dist`).

### 3. Setel Environment Variables

Di dashboard Vercel → **Settings → Environment Variables**:

| Variabel | Nilai | Wajib |
| --- | --- | --- |
| `DASHBOARD_PASSWORD` | password untuk masuk dashboard | ya |
| `GITHUB_TOKEN` | token GitHub dengan skop **Contents: Read and write** | ya |
| `GITHUB_BRANCH` | `main` (bawaan, boleh dilewati) | tidak |

Buat token di [github.com/settings/tokens](https://github.com/settings/tokens) dengan skop
`repo → Contents: Read and write` (atau *fine-grained token* yang hanya menargetkan repository ini).

`GITHUB_REPOSITORY` tidak perlu diisi: Vercel mengiriminya otomatis dari repo yang tersambung.

Setelah env ditambahkan, **Redeploy** sekali supaya variabel terbaca.

### 4. Pakai

- Buka `https://nama-project-anda.vercel.app/login` → masuk dengan password → tulis post.
- Simpan → langsung muncul commit baru di repository (file `blog-posts/<slug>/post.md` + `daftar_blog.json`).
- Vercel build ulang otomatis, post tayang dalam ±30–60 detik.
- Mengedit `.md` langsung di GitHub pun memicu build ulang yang sama.

Kalau `GITHUB_TOKEN` belum diisi, penyimpanan menolak dengan pesan jelas — post **tidak** akan disimpan diam-diam ke penyimpanan sementara yang hilang saat deploy.

### Mode lokal

Di komputer, konten tetap ditulis langsung ke `blog-posts/` (cepat, tanpa API). Variabel `GITHUB_TOKEN` **tidak** diisi di `.env` lokal supaya mode lokal tetap memakai folder.

## Konfigurasi password

Salin `.env.example` menjadi `.env` lalu isi:

```bash
cp .env.example .env
```

```env
DASHBOARD_PASSWORD=rahasia-kamu
```

- Password **diisi** → halaman publik tetap terbuka, tetapi dashboard harus masuk dulu di `/login`.
- Password **kosong** → dashboard terbuka tanpa login (berguna saat dipakai lokal).

Variabel lain: `PORT` (default `3001`) dan `DASHBOARD_SECRET` (opsional, untuk menandatangani sesi).

## Struktur post

Judul disimpan di baris pertama sebagai heading `#`. Metadata ditulis sebagai **frontmatter** opsional:

```markdown
---
title: "Judul Post"
date: "2026-10-03"
excerpt: "Ringkasan singkat untuk daftar post."
tags: "vue, markdown"
draft: false
---

# Judul Post

Isi post di sini. Mendukung **bold**, daftar, gambar, blok kode, tabel, dll.
```

- Tanpa frontmatter pun tetap bisa: judul diambil dari heading `#`.
- `draft: true` menyembunyikan post dari halaman publik.
- **`date` sebaiknya selalu diisi.** Kalau kosong, tanggal diambil dari waktu file — di Vercel itu berarti waktu build, sehingga bisa bergeser tiap deploy.
- Gambar ditulis dengan URL (`![alt](https://...)`), belum ada upload gambar.

Menambah post bisa dari dashboard **atau** langsung membuat folder + `post.md` di `blog-posts/` — daftar post dibaca dari isi folder/repo.

## Cara konten dibaca

- **Halaman publik** (beranda & baca post) membaca dari **bundel** yang dibuat Vite saat build. Tanpa panggilan API, cepat, dan draf tidak pernah ikut terkirim.
- **Dashboard** membaca dari **API**, supaya hasil simpan terbaru langsung tampil tanpa menunggu build.
- Pasca-login, halaman baca memakai API juga supaya penulis selalu melihat versi terbaru.

## Struktur proyek

```
api/
├── index.js              # fungsi Vercel: seluruh API Express
└── [...path].js          # penangkap /api/* (supaya tidak kena rewrite SPA)
server/
├── app.js                # aplikasi Express (dipakai lokal & Vercel)
├── index.js              # entry lokal: app.listen
├── content.js            # pilih penyimpanan: lokal (folder) vs GitHub API
├── posts.js              # penyimpanan lokal + parser frontmatter & slug
├── posts-github.js       # penyimpanan lewat GitHub API (commit ke repo)
├── auth.js               # login, cookie sesi, middleware
└── env.js                # loader .env tanpa dependensi
src/
├── router.js             # rute + guard dashboard
├── api.js                # klien fetch untuk dashboard
├── content.js            # sumber konten publik (bundel + cadangan API)
├── markdown.js           # marked + DOMPurify
├── views/                # Beranda, Post, Login, Dashboard, Editor, 404
├── components/           # Header, kartu post
└── assets/main.css       # seluruh styling
vite-plugin-posts.js      # bundel post terbit (tanpa draf) sebagai modul virtual
vercel.json               # routing: /api ke fungsi, sisanya ke index.html
test/posts-github.test.mjs# uji driver GitHub dengan mock API (npm test)
scripts/dev.mjs           # menjalankan server + Vite bersamaan
```

## API

| Method | Endpoint               | Keterangan                              |
| ------ | ---------------------- | --------------------------------------- |
| GET    | `/api/posts`           | post terbit                             |
| GET    | `/api/posts?scope=all` | semua post (termasuk draf, butuh login) |
| GET    | `/api/posts/:slug`     | detail post + isi Markdown              |
| POST   | `/api/posts`           | buat post (butuh login)                 |
| PUT    | `/api/posts/:slug`     | ubah post, boleh ganti slug (butuh login) |
| DELETE | `/api/posts/:slug`     | hapus post (butuh login)                |
| POST   | `/api/login`           | masuk dengan password                   |
| POST   | `/api/logout`          | keluar                                  |
| GET    | `/api/me`              | status sesi                             |
