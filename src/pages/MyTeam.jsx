import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFetch } from '../hooks/useFetch'
import { getStandings, getMatches } from '../services/footballApi'
import { getFlagCode, flagUrl } from '../utils/teamFlags'
import fallbackData from '../data/fallback.json'
import styles from './MyTeam.module.css'

const STORAGE_KEY = 'wc_followed_team'

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function getResult(match, teamId) {
  if (match.status !== 'FINISHED') return null
  const isHome = match.homeTeam.id === teamId
  const gf = isHome ? match.score.fullTime.home : match.score.fullTime.away
  const ga = isHome ? match.score.fullTime.away : match.score.fullTime.home
  return gf > ga ? 'W' : gf < ga ? 'L' : 'D'
}

function formatDate(utcStr) {
  return new Date(utcStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const TOOLTIP_STYLE = {
  background: '#162447',
  border: '1px solid #1f3a6e',
  borderRadius: '6px',
  fontSize: '0.8rem',
}

export default function MyTeam() {
  const { data: standingsData, loading: loadingS } = useFetch(getStandings, fallbackData)
  const { data: matchesData, loading: loadingM } = useFetch(getMatches, fallbackData)

  const [selectedId, setSelectedId] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEY)
    return v ? parseInt(v, 10) : null
  })
  const [search, setSearch] = useState('')

  const allTeams = useMemo(() => {
    if (!standingsData?.standings) return []
    return standingsData.standings
      .filter(g => g.stage === 'GROUP_STAGE' && g.type === 'TOTAL')
      .flatMap(g => {
        const letter = g.group.replace('GROUP_', '')
        return g.table.map(row => ({ ...row, groupLetter: letter }))
      })
      .sort((a, b) => a.team.name.localeCompare(b.team.name))
  }, [standingsData])

  const filteredTeams = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return allTeams
    return allTeams.filter(
      t =>
        t.team.name.toLowerCase().includes(q) ||
        t.team.tla.toLowerCase().includes(q)
    )
  }, [allTeams, search])

  const myTeam = useMemo(
    () => allTeams.find(t => t.team.id === selectedId),
    [allTeams, selectedId]
  )

  const myMatches = useMemo(() => {
    if (!matchesData?.matches || !selectedId) return []
    return matchesData.matches
      .filter(m => m.homeTeam.id === selectedId || m.awayTeam.id === selectedId)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
  }, [matchesData, selectedId])

  const chartData = useMemo(
    () =>
      myMatches
        .filter(m => m.status === 'FINISHED')
        .map(m => {
          const isHome = m.homeTeam.id === selectedId
          const opp = isHome
            ? (m.awayTeam.shortName ?? m.awayTeam.tla)
            : (m.homeTeam.shortName ?? m.homeTeam.tla)
          return {
            name: opp,
            'Goals For': isHome ? m.score.fullTime.home : m.score.fullTime.away,
            'Goals Against': isHome ? m.score.fullTime.away : m.score.fullTime.home,
          }
        }),
    [myMatches, selectedId]
  )

  function selectTeam(id) {
    localStorage.setItem(STORAGE_KEY, String(id))
    setSelectedId(id)
  }

  function clearTeam() {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedId(null)
    setSearch('')
  }

  if (loadingS || loadingM) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Loading" />
        <p className={styles.loadingText}>Loading team data…</p>
      </div>
    )
  }

  /* ── Team selector ── */
  if (!selectedId || !myTeam) {
    return (
      <div className={styles.page}>
        <div className={styles.selectorHeader}>
          <h2 className={styles.title}>Follow My Team</h2>
          <p className={styles.subtitle}>
            Pick a team to follow throughout the tournament
          </p>
        </div>

        <input
          type="search"
          placeholder="Search by country or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.search}
          aria-label="Search teams"
        />

        <div className={styles.teamGrid}>
          {filteredTeams.map(t => (
            <button
              key={t.team.id}
              className={styles.teamCard}
              onClick={() => selectTeam(t.team.id)}
              aria-label={`Follow ${t.team.name}`}
            >
              {getFlagCode(t.team) && (
                <img
                  className={styles.flagImg}
                  src={flagUrl(getFlagCode(t.team))}
                  alt={`${t.team.name} flag`}
                  loading="lazy"
                />
              )}
              <span className={styles.teamName}>
                {t.team.shortName ?? t.team.name}
              </span>
              <span className={styles.teamGroup}>Group {t.groupLetter}</span>
            </button>
          ))}
          {filteredTeams.length === 0 && (
            <p className={styles.noResults}>No teams match "{search}"</p>
          )}
        </div>
      </div>
    )
  }

  /* ── Team dashboard ── */
  const flagCode = getFlagCode(myTeam.team)

  const STATS = [
    { label: 'Played', value: myTeam.playedGames },
    { label: 'Won', value: myTeam.won },
    { label: 'Drawn', value: myTeam.draw },
    { label: 'Lost', value: myTeam.lost },
    { label: 'Goals For', value: myTeam.goalsFor },
    { label: 'Goals Against', value: myTeam.goalsAgainst },
    { label: 'Points', value: myTeam.points, highlight: true },
  ]

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.teamHeader}>
        <div className={styles.teamHero}>
          {flagCode && (
            <img
              className={styles.heroFlagImg}
              src={flagUrl(flagCode)}
              alt={`${myTeam.team.name} flag`}
            />
          )}
          <div>
            <h2 className={styles.heroName}>{myTeam.team.name}</h2>
            <p className={styles.heroMeta}>
              Group {myTeam.groupLetter} &middot;{' '}
              {ordinal(myTeam.position)} place
            </p>
          </div>
        </div>
        <button className={styles.changeBtn} onClick={clearTeam}>
          Change Team
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statGrid}>
        {STATS.map(s => (
          <div
            key={s.label}
            className={`${styles.statCard}${s.highlight ? ` ${styles.statHighlight}` : ''}`}
          >
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Goals chart ── */}
      {chartData.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Goals Per Match</h3>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f3a6e"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#ffffff', marginBottom: 4 }}
                  itemStyle={{ color: '#94a3b8' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.75rem', color: '#64748b' }}
                />
                <Bar
                  dataKey="Goals For"
                  fill="#3b82f6"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="Goals Against"
                  fill="#e2e8f0"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Match history ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Match History</h3>
        {myMatches.length === 0 ? (
          <p className={styles.noMatches}>No matches scheduled yet.</p>
        ) : (
          <div className={styles.historyCard}>
            {myMatches.map(m => {
              const isHome = m.homeTeam.id === selectedId
              const opp = isHome ? m.awayTeam : m.homeTeam
              const venue = isHome ? 'vs' : '@'
              const gf =
                m.status === 'FINISHED'
                  ? isHome
                    ? m.score.fullTime.home
                    : m.score.fullTime.away
                  : null
              const ga =
                m.status === 'FINISHED'
                  ? isHome
                    ? m.score.fullTime.away
                    : m.score.fullTime.home
                  : null
              const result = getResult(m, selectedId)

              return (
                <div key={m.id} className={styles.historyRow}>
                  <span className={styles.hDate}>{formatDate(m.utcDate)}</span>
                  <span className={styles.hVenue}>{venue}</span>
                  <span className={styles.hOpponent}>
                    {getFlagCode(opp) && (
                      <img
                        className={styles.hOppFlagImg}
                        src={flagUrl(getFlagCode(opp))}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    )}
                    {opp.shortName ?? opp.name}
                  </span>
                  <span className={styles.hScore}>
                    {result != null ? `${gf} – ${ga}` : '–'}
                  </span>
                  <span
                    className={`${styles.hBadge} ${
                      result === 'W'
                        ? styles.badgeW
                        : result === 'D'
                        ? styles.badgeD
                        : result === 'L'
                        ? styles.badgeL
                        : styles.badgePending
                    }`}
                  >
                    {result ?? 'TBD'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
