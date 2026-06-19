const PREFIX = 'wc_cache_'
const DEFAULT_TTL = 5 * 60 * 1000

export function getCached(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { data, ts, ttl = DEFAULT_TTL } = JSON.parse(raw)
    if (Date.now() - ts > ttl) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCached(key, data, ttl = DEFAULT_TTL) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now(), ttl }))
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}

export function clearCached(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {}
}

export function clearAllCached() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}
