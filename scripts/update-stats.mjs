#!/usr/bin/env node
// scripts/update-stats.mjs
// Fetches finished WC2026 match summaries from ESPN and regenerates
// src/data/stats.json with real tournament, team, and player stats.
// Requires Node 18+ (native fetch). Run: node scripts/update-stats.mjs

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATS_PATH = resolve(__dirname, '..', 'src', 'data', 'stats.json')

const ESPN_V2   = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world'
const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// flagcdn.com country codes for each WC2026 TLA
const TLA_FLAG = {
  MEX:'mx', KOR:'kr', CZE:'cz', RSA:'za', CAN:'ca', BIH:'ba', QAT:'qa', SUI:'ch',
  SCO:'gb-sct', MAR:'ma', BRA:'br', HAI:'ht', USA:'us', AUS:'au', TUR:'tr', PAR:'py',
  GER:'de', ECU:'ec', CIV:'ci', CUW:'cw', NED:'nl', JPN:'jp', SWE:'se', TUN:'tn',
  BEL:'be', IRN:'ir', EGY:'eg', NZL:'nz', ESP:'es', URU:'uy', KSA:'sa', CPV:'cv',
  FRA:'fr', SEN:'sn', NOR:'no', IRQ:'iq', ARG:'ar', AUT:'at', ALG:'dz', JOR:'jo',
  POR:'pt', COL:'co', COD:'cd', UZB:'uz', ENG:'gb-eng', CRO:'hr', GHA:'gh', PAN:'pa',
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'WC2026-Stats-Bot/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Extract a numeric stat value by trying multiple name variants
function findStat(statistics, ...names) {
  for (const name of names) {
    const s = (statistics ?? []).find(s =>
      s.name === name || s.displayName === name || s.label === name
    )
    if (s != null) {
      const raw = String(s.displayValue ?? s.value ?? '0').replace('%', '')
      const n = parseFloat(raw)
      return isNaN(n) ? 0 : n
    }
  }
  return 0
}

// Build YYYYMMDD strings from tournament start to today
function datesBetween(startYMD) {
  const dates = []
  const d = new Date(
    parseInt(startYMD.slice(0, 4)),
    parseInt(startYMD.slice(4, 6)) - 1,
    parseInt(startYMD.slice(6, 8))
  )
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  while (d <= today) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}${m}${day}`)
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // 1. Standings: authoritative source for goals/goals-against per team
  console.log('Fetching standings…')
  const standingsRaw = await get(`${ESPN_V2}/standings`)

  const teamMap = {}   // TLA -> mutable stats object
  let totalGoals = 0

  for (const group of (standingsRaw.children ?? [])) {
    for (const entry of (group.standings?.entries ?? [])) {
      const tla  = entry.team?.abbreviation
      if (!tla) continue
      const stats = entry.stats ?? []
      const gf    = stats.find(s => s.name === 'pointsFor'      || s.abbreviation === 'PF')?.value ?? 0
      const ga    = stats.find(s => s.name === 'pointsAgainst'  || s.abbreviation === 'PA')?.value ?? 0
      const gp    = stats.find(s => s.name === 'gamesPlayed'    || s.abbreviation === 'GP')?.value ?? 0
      totalGoals += gf
      teamMap[tla] = {
        tla,
        name:          entry.team?.displayName ?? tla,
        flagCode:      TLA_FLAG[tla] ?? tla.toLowerCase(),
        goals:         gf,
        goalsAgainst:  ga,
        gamesPlayed:   gp,
        cleanSheets:   0,
        shots:         0,
        shotsOnTarget: 0,
        saves:         0,
        fouls:         0,
        yellowCards:   0,
        redCards:      0,
        possession:    0,
        possMatches:   0,
        corners:       0,
      }
    }
  }
  // Goals counted once per team; divide by 2 would double-count finished — use raw total
  totalGoals = Math.round(totalGoals / 2)

  // 2. Scoreboard: collect all finished match IDs
  console.log('Scanning scoreboard for finished matches…')
  const dates = datesBetween('20260611')  // WC2026 group stage start
  const finishedIds = new Set()

  for (const date of dates) {
    try {
      const sb = await get(`${ESPN_SITE}/scoreboard?dates=${date}&limit=100`)
      for (const ev of (sb.events ?? [])) {
        const comp   = ev.competitions?.[0]
        const status = comp?.status?.type
        if (status?.completed || status?.name === 'STATUS_FINAL') {
          finishedIds.add(ev.id)
        }
      }
    } catch (e) {
      console.warn(`  Scoreboard ${date}: ${e.message}`)
    }
    await sleep(150)
  }
  console.log(`  Found ${finishedIds.size} finished matches`)

  // 3. Match summaries: per-team and per-player stats
  let totalFouls      = 0
  let totalYellowCards = 0
  let totalRedCards   = 0
  let totalAttendance = 0
  let penaltiesAwarded = 0
  let penaltiesScored  = 0
  let ownGoals         = 0
  let matchesPlayed    = 0

  const players = {}  // displayName -> mutable player object

  function ensurePlayer(name, tla) {
    if (!players[name]) {
      players[name] = {
        name,
        tla:            tla ?? '',
        flagCode:       TLA_FLAG[tla] ?? (tla ?? '').toLowerCase(),
        goals:          0,
        goalsPerNinety: 0,
        assists:        0,
        yellowCards:    0,
        saves:          null,
        savePercent:    null,
        keeperCleanSheets: null,
      }
    }
    return players[name]
  }

  for (const eventId of finishedIds) {
    try {
      console.log(`  Summary ${eventId}…`)
      const s = await get(`${ESPN_V2}/summary?event=${eventId}`)
      matchesPlayed++

      // Attendance
      const att = s.header?.competitions?.[0]?.attendance
               ?? s.gameInfo?.attendance ?? 0
      totalAttendance += att

      // Per-team boxscore stats
      for (const bt of (s.boxscore?.teams ?? [])) {
        const tla  = bt.team?.abbreviation
        const team = tla ? teamMap[tla] : null
        if (!team) continue
        const st = bt.statistics ?? []

        const shots    = findStat(st, 'totalShots',    'Total Shots',    'shots')
        const onTarget = findStat(st, 'shotsOnTarget', 'Shots on Goal',  'Shots on Target')
        const fouls    = findStat(st, 'fouls',         'Fouls')
        const yc       = findStat(st, 'yellowCards',   'Yellow Cards')
        const rc       = findStat(st, 'redCards',      'Red Cards')
        const corners  = findStat(st, 'corners',       'Corner Kicks',   'Corners')
        const saves    = findStat(st, 'saves',         'Saves',          'Goalkeeper Saves')
        const possRaw  = findStat(st, 'possessionPct', 'Possession')

        team.shots         += shots
        team.shotsOnTarget += onTarget
        team.fouls         += fouls
        team.yellowCards   += yc
        team.redCards      += rc
        team.corners       += corners
        team.saves         += saves
        team.possession    += possRaw
        team.possMatches   += 1

        totalFouls       += fouls
        totalYellowCards += yc
        totalRedCards    += rc
      }

      // Clean sheets from competitor final scores
      const comps = s.header?.competitions?.[0]?.competitors ?? []
      if (comps.length === 2) {
        const [c0, c1] = comps
        const s0 = parseInt(c0.score ?? '0') || 0
        const s1 = parseInt(c1.score ?? '0') || 0
        const t0 = teamMap[c0.team?.abbreviation]
        const t1 = teamMap[c1.team?.abbreviation]
        if (t0 && s1 === 0) t0.cleanSheets++
        if (t1 && s0 === 0) t1.cleanSheets++
      }

      // Scoring plays: goals, penalties, own goals, assists
      for (const play of (s.scoringPlays ?? [])) {
        const typeText = (play.type?.text ?? play.type?.name ?? '').toLowerCase()
        const teamTla  = play.team?.abbreviation

        const isPenalty = typeText.includes('penalty')
        const isOwnGoal = typeText.includes('own goal') || typeText.includes('own-goal')
        const isMissed  = typeText.includes('missed') || typeText.includes('saved')

        if (isPenalty) penaltiesAwarded++
        if (isPenalty && !isMissed) penaltiesScored++
        if (isOwnGoal) ownGoals++

        for (const part of (play.participants ?? [])) {
          const pName = part.athlete?.displayName
          if (!pName) continue
          const pType = (part.type?.name ?? part.type?.text ?? '').toLowerCase()
          const p = ensurePlayer(pName, teamTla)

          if (pType === 'scorer' || pType === 'goal' || pType === '') {
            if (!isOwnGoal && !isMissed) p.goals++
          } else if (pType === 'assist') {
            p.assists++
          }
        }
      }

      // Yellow cards from key events
      for (const ev of (s.keyEvents ?? [])) {
        const typeText = (ev.type?.text ?? ev.type?.name ?? '').toLowerCase()
        if (!typeText.includes('yellow')) continue
        const pName = ev.participants?.[0]?.athlete?.displayName
        if (pName) ensurePlayer(pName, ev.team?.abbreviation).yellowCards++
      }

      // Goalkeeper saves from boxscore player stats
      for (const teamPlayers of (s.boxscore?.players ?? [])) {
        const tla = teamPlayers.team?.abbreviation
        for (const statGroup of (teamPlayers.statistics ?? [])) {
          const keys   = statGroup.keys ?? []
          const savIdx = keys.findIndex(k => k === 'saves' || k === 'SV')
          const sotIdx = keys.findIndex(k => k === 'shotsOnTargetAgainst' || k === 'SOT')
          for (const athlete of (statGroup.athletes ?? [])) {
            const pos = athlete.athlete?.position?.abbreviation ?? ''
            if (pos !== 'GK') continue
            const pName = athlete.athlete?.displayName
            if (!pName) continue
            const p = ensurePlayer(pName, tla)
            const sv  = savIdx >= 0 ? (parseInt(athlete.stats?.[savIdx]) || 0) : 0
            const sot = sotIdx >= 0 ? (parseInt(athlete.stats?.[sotIdx]) || 0) : 0
            p.saves         = (p.saves ?? 0) + sv
            p._shotsAgainst = ((p._shotsAgainst ?? 0) + sot)
          }
        }
      }
    } catch (e) {
      console.warn(`  Summary ${eventId} failed: ${e.message}`)
    }
    await sleep(200)
  }

  // 4. Finalize team stats
  const teamStats = Object.values(teamMap)
    .filter(t => t.gamesPlayed > 0)
    .map(({ possMatches, gamesPlayed, ...t }) => ({
      ...t,
      possession: possMatches > 0 ? Math.round(t.possession / possMatches) : 50,
    }))
    .sort((a, b) => b.goals - a.goals || a.tla.localeCompare(b.tla))

  // 5. Finalize player stats — goals/90 based on team matches played
  const playerStats = Object.values(players)
    .filter(p => p.goals > 0 || (p.assists > 0) || (p.saves ?? 0) > 0)
    .map(p => {
      const teamGP = (teamMap[p.tla]?.gamesPlayed ?? 1) || 1
      const sv     = p.saves ?? 0
      const sot    = p._shotsAgainst ?? 0
      return {
        name:            p.name,
        tla:             p.tla,
        flagCode:        p.flagCode,
        goals:           p.goals,
        goalsPerNinety:  p.goals > 0 ? +(p.goals / teamGP * 90 / 90).toFixed(2) : 0,
        assists:         p.assists,
        saves:           p.saves != null ? sv : null,
        savePercent:     sv > 0 && sot > 0 ? Math.round((sv / sot) * 100) : (p.saves != null ? 0 : null),
        keeperCleanSheets: p.saves != null ? (teamMap[p.tla]?.cleanSheets ?? 0) : null,
        yellowCards:     p.yellowCards,
      }
    })
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)

  // 6. Build output
  const output = {
    _updated: new Date().toISOString(),
    tournament: {
      totalGoals,
      matchesPlayed,
      totalFouls,
      yellowCards:     totalYellowCards,
      redCards:        totalRedCards,
      penaltiesAwarded,
      penaltiesScored,
      ownGoals,
      cleanSheets:     teamStats.reduce((s, t) => s + t.cleanSheets, 0),
      totalAttendance,
      avgPossession:   50,
    },
    teamStats,
    playerStats,
  }

  writeFileSync(STATS_PATH, JSON.stringify(output, null, 2))
  console.log(`\n✅ stats.json written`)
  console.log(`   ${teamStats.length} teams | ${playerStats.length} players | ${matchesPlayed} matches | ${totalGoals} goals`)
}

main().catch(e => { console.error(e); process.exit(1) })
