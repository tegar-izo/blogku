# AGENTS.md

Vue 3 + Vite blog with an Express API and a file/GitHub-backed Markdown store. Content lives in `blog-posts/<slug>/post.md`; there is no DB.

## Commands

- `npm run dev` — runs API (port 3001) and Vite (port 5173) together via `scripts/dev.mjs`; Vite proxies `/api` to the API port.
- `npm test` — runs the single node script `test/posts-github.test.mjs` (mocked GitHub API). No test framework; no other suites.
- `npm run build` → `dist/`; `npm start` serves `dist/` + API on port 3001.
- No lint, no typecheck, no CI workflows — do not invent them.

## Gotchas

- **Storage driver switch**: `server/content.js` picks GitHub API mode if `process.env.VERCEL` **or** `GITHUB_TOKEN` is set. Locally, keep `GITHUB_TOKEN` empty or you'll silently write to GitHub instead of `blog-posts/`. `.env` is loaded by `server/env.js` (no dotenv dependency).
- **Public pages read a build-time bundle**, not the API: `vite-plugin-posts.js` exposes `virtual:published-posts` with drafts excluded. Editing markdown triggers a full reload in dev, but a production rebuild is required for content changes to appear.
- **Dashboard reads the API**, so it shows fresh edits without a rebuild; public post view also switches to API when logged in (`src/content.js`).
- Draft filtering happens at bundle time — drafts must never appear in the virtual module (see plugin comment).
- `blog-posts/daftar_blog.json` is the synced slug list; the post list is derived from the folder/repo, so you can also add posts by creating `blog-posts/<slug>/post.md` directly.
- Always set `date` in frontmatter; without it the date falls back to file mtime, which on Vercel equals build time and shifts each deploy.
- Auth: empty `DASHBOARD_PASSWORD` = open dashboard; set = `/login` required. Sessions via `httpOnly` cookie, optional `DASHBOARD_SECRET`.
- Vercel: `api/index.js` + `api/[...path].js` wrap the same Express app (`server/app.js`); `vercel.json` rewrites `/api/*` to the function, everything else to `index.html` (SPA). Express 5 — wildcard routes use `[...path]` syntax.

## Layout notes

- `server/posts.js` — local markdown storage + frontmatter parsing (title from first `#` heading if no frontmatter).
- `server/posts-github.js` — same interface over GitHub API; `server/content.js` re-exports the chosen driver, so new store functions must be added to both drivers.
- `src/views/` has Beranda/Post/Login/Dashboard/Editor/404; `src/router.js` holds the dashboard guard.
- `PORT` env changes both the API listen port and the Vite proxy target (vite.config.js reads it too).
