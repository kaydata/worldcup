const PREFIX = 'wc_cache_'
const TTL = 5 * 60 * 1000 // 5 minutes

export function getCached(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCached(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}

export function clearCached(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {}
}
