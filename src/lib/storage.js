export function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    if (err?.name === 'QuotaExceededError') {
      throw new Error('Browser storage is full. Remove some product images and try again.')
    }
    throw err
  }
}

export function removeKey(key) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export function wait(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createId(prefix = '') {
  return `${prefix}${crypto.randomUUID()}`
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
