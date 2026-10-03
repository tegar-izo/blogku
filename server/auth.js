// Autentikasi dashboard: satu password dari env, sesi berupa cookie httpOnly
// yang ditandatangani HMAC. Kalau password kosong, dashboard terbuka tanpa login.
import './env.js'
import crypto from 'node:crypto'
import { HttpError } from './posts.js'

const PASSWORD = process.env.DASHBOARD_PASSWORD || ''
export const authRequired = PASSWORD.length > 0

const COOKIE_NAME = 'dashboard_session'
const SECRET = process.env.DASHBOARD_SECRET || (authRequired ? PASSWORD : 'dev-secret')
const TOKEN = authRequired
  ? crypto.createHmac('sha256', SECRET).update('vue-md-blog-session-v1').digest('hex')
  : ''

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8')
  const right = Buffer.from(String(b ?? ''), 'utf8')
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function readCookie(req, name) {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const sep = part.indexOf('=')
    if (sep === -1) continue
    if (part.slice(0, sep).trim() === name) return decodeURIComponent(part.slice(sep + 1).trim())
  }
  return null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function authMiddleware(req, _res, next) {
  const token = authRequired ? readCookie(req, COOKIE_NAME) : ''
  req.auth = {
    authRequired,
    authenticated: !authRequired || Boolean(token) && safeEqual(token, TOKEN),
  }
  next()
}

export function requireAuth(req, _res, next) {
  if (!req.auth?.authenticated) {
    next(new HttpError(401, 'Silakan masuk ke dashboard terlebih dahulu.'))
    return
  }
  next()
}

export function getSessionInfo(req) {
  return {
    authRequired,
    authenticated: Boolean(req.auth?.authenticated),
  }
}

export async function login(req, res) {
  if (!authRequired) {
    res.json({ ok: true, authRequired: false })
    return
  }

  const password = String(req.body?.password ?? '')
  if (!safeEqual(password, PASSWORD)) {
    await sleep(300)
    throw new HttpError(401, 'Password salah.')
  }

  res.cookie(COOKIE_NAME, TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    // Selalu HTTPS di Vercel; lokal biasanya jalan lewat http.
    secure: Boolean(process.env.VERCEL),
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.json({ ok: true, authRequired: true })
}

export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
}
