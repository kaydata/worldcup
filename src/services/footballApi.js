import { getCached, setCached, clearCached, clearAllCached } from './cache.js'
import fallback from '../data/fallback.json'

const ESPN_V2   = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world'
const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

const SCOREBOARD_TTL = 60 * 1000 // 60 seconds for live match data

async function get(url, cacheKey, ttl) {
  const key = cacheKey ?? url
  const hit = getCached(key)
  if (hit) return hit
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN ${res.status} ${res.statusText} — ${url}`)
  const data = await res.json()
  setCached(key, data, ttl)
  return data
}

function statVal(stats, name) {
  return stats?.find(s => s.name === name)?.value ?? 0
}

function normalizeTeam(t = {}) {
  return {
    id:        Number(t.id) || 0,
    name:      t.displayName ?? t.name ?? '',
    shortName: t.shortDisplayName ?? t.displayName ?? t.name ?? '',
    tla:       t.abbreviation ?? '',
    crest:     t.logos?.[0]?.href ?? '',
  }
}

const ESPN_STATUS = {
  STATUS_FULL_TIME:    'FINISHED',
  STATUS_FINAL:        'FINISHED',
  STATUS_IN_PROGRESS:  'IN_PLAY',
  STATUS_HALFTIME:     'PAUSED',
  STATUS_SCHEDULED:    'SCHEDULED',
  STATUS_TIMED:        'TIMED',
  STATUS_POSTPONED:    'POSTPONED',
  STATUS_SUSPENDED:    'SUSPENDED',
  STATUS_CANCELED:     'CANCELLED',
}

export async function getStandings() {
  const raw = await get(`${ESPN_V2}/standings`, 'espn:standings')
  const standings = (raw.children ?? []).map(group => {
    const letter = group.name.replace('Group ', '')
    return {
      stage: 'GROUP_STAGE',
      type:  'TOTAL',
      group: `GROUP_${letter}`,
      table: (group.standings?.entries ?? []).map(entry => {
        const s = entry.stats ?? []
        return {
          position:       entry.note?.rank ?? 0,
          team:           normalizeTeam(entry.team),
          playedGames:    statVal(s, 'gamesPlayed'),
          won:            statVal(s, 'wins'),
          draw:           statVal(s, 'ties'),
          lost:           statVal(s, 'losses'),
          points:         statVal(s, 'points'),
          goalsFor:       statVal(s, 'pointsFor'),
          goalsAgainst:   statVal(s, 'pointsAgainst'),
          goalDifference: statVal(s, 'pointDifferential'),
        }
      }),
    }
  })
  return { standings }
}

function normalizeEvent(event, teamGroup) {
  const comp      = event.competitions?.[0] ?? {}
  const status    = comp.status?.type ?? {}
  const home      = comp.competitors?.find(c => c.homeAway === 'home')
  const away      = comp.competitors?.find(c => c.homeAway === 'away')
  const homeId    = Number(home?.team?.id) || 0
  const statusStr = ESPN_STATUS[status.name] ?? (status.completed ? 'FINISHED' : 'SCHEDULED')
  return {
    id:       String(event.id),
    stage:    'GROUP_STAGE',
    group:    teamGroup[homeId] ?? null,
    utcDate:  event.date,
    matchday: 1,
    status:   statusStr,
    homeTeam: normalizeTeam(home?.team),
    awayTeam: normalizeTeam(away?.team),
    score: {
      fullTime: {
        home: home?.score != null ? Number(home.score) : null,
        away: away?.score != null ? Number(away.score) : null,
      },
    },
  }
}

// Returns "YYYYMMDD" in UTC
function toYMD(d) {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('')
}

// All dates from WC2026 group-stage start through tomorrow.
// Past dates never change so we cache them for 24 h; today 60 s; future 5 min.
function tournamentDates() {
  const start = new Date(Date.UTC(2026, 5, 11)) // 11 Jun 2026
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const today = toYMD(new Date())
  const result = []
  const d = new Date(start)
  while (d <= tomorrow) {
    const ymd = toYMD(d)
    result.push({
      ymd,
      ttl: ymd < today ? 24 * 60 * 60 * 1000   // past  → 24 h
         : ymd === today ? SCOREBOARD_TTL         // today → 60 s
         : 5 * 60 * 1000,                         // future → 5 min
    })
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return result
}

export async function getMatches() {
  // Build team-id → group map from live standings (falls back to static)
  const teamGroup = {}
  try {
    const standingsData = await getStandings()
    for (const group of standingsData.standings)
      for (const row of group.table)
        teamGroup[row.team.id] = group.group
  } catch {
    for (const group of fallback.standings ?? [])
      for (const row of group.table ?? [])
        teamGroup[row.team.id] = group.group
  }

  // Fetch every group-stage date in parallel.
  // Past dates are cached 24 h so repeat visits are instant;
  // only today re-fetches every 60 s for live scores.
  const dates = tournamentDates()
  let espnMatches = []
  let espnFailed = false

  try {
    const responses = await Promise.allSettled(
      dates.map(({ ymd, ttl }) =>
        get(`${ESPN_SITE}/scoreboard?dates=${ymd}`, `espn:scoreboard:${ymd}`, ttl)
      )
    )
    const seen = new Set()
    for (const r of responses) {
      if (r.status !== 'fulfilled') continue
      for (const e of (r.value.events ?? [])) {
        if (!seen.has(e.id)) {
          seen.add(e.id)
          espnMatches.push(normalizeEvent(e, teamGroup))
        }
      }
    }
    if (espnMatches.length === 0) espnFailed = true
  } catch {
    espnFailed = true
  }

  // Fallback provides future fixtures ESPN hasn't published yet.
  // Any match ESPN has already returned takes precedence.
  const espnIds = new Set(espnMatches.map(m => String(m.id)))
  const fallbackOnly = (fallback.matches ?? []).filter(m => !espnIds.has(String(m.id)))

  const matches = [...fallbackOnly, ...espnMatches].sort(
    (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
  )

  return { matches, espnFailed }
}

// ESPN has no public WC top-scorers endpoint — serve static data from fallback.json
export async function getScorers() {
  return { scorers: fallback.scorers ?? [] }
}

export async function getTeam(id) {
  const raw = await get(`${ESPN_SITE}/teams/${id}`, `espn:team:${id}`)
  return normalizeTeam(raw.team)
}

export function invalidateMatches() {
  // Past scoreboard entries won't change — only bust today and standings
  clearCached(`espn:scoreboard:${toYMD(new Date())}`)
  clearCached('espn:standings')
}
