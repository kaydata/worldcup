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

// Returns "YYYYMMDD" in UTC for ESPN date queries
function utcDateStr(offsetDays = 0) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('')
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

  // Fetch ESPN scoreboards for yesterday, today and tomorrow so the MatchDay
  // panel always has both yesterday's results and upcoming fixtures.
  // Yesterday and tomorrow are cached for 5 min; today uses 60 s TTL.
  const days = [-1, 0, 1]
  const dateStrs = days.map(utcDateStr)

  let espnMatches = []
  let espnFailed = false
  try {
    const responses = await Promise.all(
      dateStrs.map((ds, i) =>
        get(
          `${ESPN_SITE}/scoreboard?dates=${ds}`,
          `espn:scoreboard:${ds}`,
          i === 1 ? SCOREBOARD_TTL : 5 * 60 * 1000
        )
      )
    )
    const seen = new Set()
    for (const raw of responses) {
      for (const e of (raw.events ?? [])) {
        if (!seen.has(e.id)) {
          seen.add(e.id)
          espnMatches.push(normalizeEvent(e, teamGroup))
        }
      }
    }
  } catch {
    espnFailed = true
  }

  // Merge: fallback provides base for future fixtures; ESPN overrides by ID
  const espnIds = new Set(espnMatches.map(m => String(m.id)))
  const historical = (fallback.matches ?? []).filter(m => !espnIds.has(String(m.id)))

  const matches = [...historical, ...espnMatches].sort(
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
  clearAllCached()
}
