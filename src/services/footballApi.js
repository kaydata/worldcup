import { getCached, setCached, clearCached } from './cache.js'

const API_BASE = 'https://api.football-data.org/v4'
const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY

const headers = {
  'X-Auth-Token': API_KEY,
}

async function get(path) {
  const cached = getCached(path)
  if (cached) return cached

  const res = await fetch(`${API_BASE}${path}`, { headers })
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  const data = await res.json()
  setCached(path, data)
  return data
}

export async function getCompetition(code = 'WC') {
  return get(`/competitions/${code}`)
}

export async function getStandings(code = 'WC') {
  return get(`/competitions/${code}/standings`)
}

export async function getMatches(code = 'WC') {
  return get(`/competitions/${code}/matches`)
}

export async function getTeam(id) {
  return get(`/teams/${id}`)
}

export async function getScorers(code = 'WC') {
  return get(`/competitions/${code}/scorers`)
}

export function invalidateMatches(code = 'WC') {
  clearCached(`/competitions/${code}/matches`)
}
