import { useState, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { getStandings, getMatches } from '../services/footballApi'
import { getFlagCode, flagUrl } from '../utils/teamFlags'
import fallbackData from '../data/fallback.json'
import styles from './Compare.module.css'

const STAT_KEYS = [
  { key: 'points',         label: 'Points',        higher: true },
  { key: 'won',            label: 'Won',            higher: true },
  { key: 'draw',           label: 'Drawn',          higher: false },
  { key: 'lost',           label: 'Lost',           higher: false },
  { key: 'goalsFor',       label: 'Goals For',      higher: true },
  { key: 'goalsAgainst',   label: 'Goals Against',  higher: false },
  { key: 'goalDifference', label: 'Goal Diff',      higher: true },
]

// Always uses valid flagcdn sizes (w80 display, w160 2×)
function TeamFlag({ team, className }) {
  const code = getFlagCode(team)
  if (!code) {
    return (
      <span className={`${styles.tlaFallback} ${className ?? ''}`}>
        {team.tla || '?'}
      </span>
    )
  }
  return (
    <img
      src={flagUrl(code, 80)}
      srcSet={`${flagUrl(code, 160)} 2x`}
      alt=""
      aria-hidden="true"
      className={`${styles.flagImg} ${className ?? ''}`}
    />
  )
}

export default function Compare() {
  const { data: standingsData } = useFetch(
    getStandings,
    { standings: fallbackData.standings }
  )
  const { data: matchesData } = useFetch(
    getMatches,
    { matches: fallbackData.matches }
  )

  const [teamAId, setTeamAId] = useState('')
  const [teamBId, setTeamBId] = useState('')

  const allTeams = useMemo(() => {
    const groups = standingsData?.standings ?? []
    return groups
      .flatMap(g => g.table.map(row => ({ ...row, groupLabel: g.group.replace('GROUP_', '') })))
      .sort((a, b) => a.team.name.localeCompare(b.team.name))
  }, [standingsData])

  const teamById = useMemo(() => {
    const map = {}
    for (const t of allTeams) map[t.team.id] = t
    return map
  }, [allTeams])

  const teamA = teamById[Number(teamAId)] ?? null
  const teamB = teamById[Number(teamBId)] ?? null

  const h2h = useMemo(() => {
    if (!teamA || !teamB) return null
    const matches = matchesData?.matches ?? []
    return matches.find(m => {
      const ids = [m.homeTeam.id, m.awayTeam.id]
      return ids.includes(teamA.team.id) && ids.includes(teamB.team.id)
    }) ?? null
  }, [teamA, teamB, matchesData])

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Head-to-Head</h2>
      <p className={styles.subtitle}>Compare any two teams in the tournament</p>

      {/* Selectors */}
      <div className={styles.selectors}>
        <div className={styles.selectorWrap}>
          <select
            className={styles.select}
            value={teamAId}
            onChange={e => setTeamAId(e.target.value)}
            aria-label="Select first team"
          >
            <option value="">Choose a team…</option>
            {allTeams.map(t => (
              <option
                key={t.team.id}
                value={t.team.id}
                disabled={String(t.team.id) === String(teamBId)}
              >
                {t.team.name}
              </option>
            ))}
          </select>
        </div>

        <span className={styles.vsBadge}>vs</span>

        <div className={styles.selectorWrap}>
          <select
            className={styles.select}
            value={teamBId}
            onChange={e => setTeamBId(e.target.value)}
            aria-label="Select second team"
          >
            <option value="">Choose a team…</option>
            {allTeams.map(t => (
              <option
                key={t.team.id}
                value={t.team.id}
                disabled={String(t.team.id) === String(teamAId)}
              >
                {t.team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {teamA && teamB ? (
        <div className={styles.panel}>
          {/* Team header — flag + name only, no group chips */}
          <div className={styles.teamHeader}>
            <div className={styles.teamInfo}>
              <TeamFlag team={teamA.team} />
              <span className={styles.teamName}>{teamA.team.shortName ?? teamA.team.name}</span>
            </div>

            <div className={styles.vsCenter}>vs</div>

            <div className={`${styles.teamInfo} ${styles.teamInfoRight}`}>
              <TeamFlag team={teamB.team} />
              <span className={styles.teamName}>{teamB.team.shortName ?? teamB.team.name}</span>
            </div>
          </div>

          {/* Stat bars */}
          <div className={styles.statsGrid}>
            {STAT_KEYS.map(({ key, label, higher }) => {
              const va = teamA[key] ?? 0
              const vb = teamB[key] ?? 0
              const maxVal = Math.max(va, vb, 1)
              const pctA = Math.round((va / maxVal) * 100)
              const pctB = Math.round((vb / maxVal) * 100)
              const aWins = higher ? va > vb : va < vb
              const bWins = higher ? vb > va : vb < va

              return (
                <div key={key} className={styles.statRow}>
                  <span className={`${styles.statVal} ${aWins ? styles.statWinner : ''}`}>{va}</span>
                  <div className={styles.barGroup}>
                    <div className={styles.barA}>
                      <div
                        className={`${styles.barFill} ${styles.barFillA} ${aWins ? styles.barWinner : ''}`}
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                    <span className={styles.statLabel}>{label}</span>
                    <div className={styles.barB}>
                      <div
                        className={`${styles.barFill} ${styles.barFillB} ${bWins ? styles.barWinner : ''}`}
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                  </div>
                  <span className={`${styles.statVal} ${styles.statValRight} ${bWins ? styles.statWinner : ''}`}>{vb}</span>
                </div>
              )
            })}
          </div>

          {/* Head-to-head result */}
          {h2h && (
            <div className={styles.h2hSection}>
              <span className={styles.h2hLabel}>Head to Head</span>
              {h2h.status === 'FINISHED' ? (
                <div className={styles.h2hResult}>
                  <span className={styles.h2hTeam}>{h2h.homeTeam.shortName ?? h2h.homeTeam.name}</span>
                  <span className={styles.h2hScore}>
                    {h2h.score?.fullTime?.home} – {h2h.score?.fullTime?.away}
                  </span>
                  <span className={styles.h2hTeam}>{h2h.awayTeam.shortName ?? h2h.awayTeam.name}</span>
                  <span className={styles.h2hMeta}>
                    Group {h2h.group?.replace('GROUP_', '')} · MD{h2h.matchday}
                  </span>
                </div>
              ) : (
                <div className={styles.h2hPending}>
                  These teams meet in Group {h2h.group?.replace('GROUP_', '')} · MD{h2h.matchday}
                  {' on '}
                  {new Date(h2h.utcDate).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', timeZone: 'Europe/London',
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>⚽</span>
          <p>Select two teams above to compare their stats</p>
        </div>
      )}
    </div>
  )
}
