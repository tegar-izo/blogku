// Pemilihan penyimpanan konten:
// - Lokal: tulis langsung ke folder blog-posts/ (cepat, cocok untuk pengembangan).
// - Vercel: filesystem read-only & hilang tiap deploy → commit ke repo via GitHub API.
import './env.js'
import * as local from './posts.js'
import * as remote from './posts-github.js'

const useGithub = Boolean(process.env.VERCEL || process.env.GITHUB_TOKEN)

const driver = useGithub ? remote : local

export const listPosts = driver.listPosts
export const readPost = driver.readPost
export const createPost = driver.createPost
export const updatePost = driver.updatePost
export const deletePost = driver.deletePost
