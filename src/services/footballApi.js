import { getCached, setCached, clearCached } from './cache.js'
import fallback from '../data/fallback.json'

// No API key needed — ESPN endpoints are public
const ESPN_V2   = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world'
const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

async function get(url, cacheKey) {
  const key = cacheKey ?? url
  const hit = getCached(key)
  if (hit) return hit
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN ${res.status} ${res.statusText} — ${url}`)
  const data = await res.json()
  setCached(key, data)
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

// ESPN status.type.name → football-data.org status string used by components
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
  const comp     = event.competitions?.[0] ?? {}
  const status   = comp.status?.type ?? {}
  const home     = comp.competitors?.find(c => c.homeAway === 'home')
  const away     = comp.competitors?.find(c => c.homeAway === 'away')
  const homeId   = Number(home?.team?.id) || 0
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

export async function getMatches() {
  // Build team-id → group map; try live ESPN standings, fall back to static
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

  // Fetch today's live scoreboard from ESPN (best-effort)
  let espnMatches = []
  try {
    const raw = await get(`${ESPN_SITE}/scoreboard`, 'espn:scoreboard')
    espnMatches = (raw.events ?? []).map(e => normalizeEvent(e, teamGroup))
  } catch {
    // ESPN unavailable — historical fallback data covers everything played so far
  }

  // ESPN scoreboard only returns today's events; fallback.json holds historical results.
  // Merge: fallback provides the base, ESPN overrides/adds its events by ID.
  const espnIds = new Set(espnMatches.map(m => String(m.id)))
  const historical = (fallback.matches ?? []).filter(m => !espnIds.has(String(m.id)))

  const matches = [...historical, ...espnMatches].sort(
    (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
  )

  return { matches }
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
  clearCached('espn:scoreboard')
  clearCached('espn:standings')
}
