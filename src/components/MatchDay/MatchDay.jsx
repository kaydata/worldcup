import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { getMatches } from '../../services/footballApi'
import { getFlagCode, flagUrl } from '../../utils/teamFlags'
import fallbackData from '../../data/fallback.json'
import styles from './MatchDay.module.css'

// Returns "YYYY-MM-DD" in London timezone
function londonDateStr(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

// Returns "HH:MM" in London timezone, or "TBC" for midnight-UTC placeholders
function londonTime(utcDate) {
  const d = new Date(utcDate)
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) return 'TBC'
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })
}

// Formats "YYYY-MM-DD" → "17 Jun 2026"
function formatDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function Flag({ team }) {
  const code = getFlagCode(team)
  if (!code) return null
  return (
    <img
      src={flagUrl(code, 40)}
      srcSet={`${flagUrl(code, 80)} 2x`}
      alt={team.tla ?? team.name}
      className={styles.flagImg}
    />
  )
}

function FlagLg({ team }) {
  const code = getFlagCode(team)
  if (!code) return null
  return (
    <img
      src={flagUrl(code, 40)}
      srcSet={`${flagUrl(code, 80)} 2x`}
      alt={team.tla ?? team.name}
      className={`${styles.flagImg} ${styles.flagImgLg}`}
    />
  )
}

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED'])

function MatchItem({ match, onClick }) {
  const { homeTeam, awayTeam, score, status } = match
  const isFinished = status === 'FINISHED'
  const isLive = LIVE_STATUSES.has(status)

  if (isFinished) {
    const h = score?.fullTime?.home
    const a = score?.fullTime?.away
    const homeWin = h > a, awayWin = a > h, draw = h === a
    return (
      <button
        className={styles.row}
        onClick={onClick}
        aria-label={`${homeTeam.name} ${h}–${a} ${awayTeam.name}, full time`}
      >
        <span className={styles.teamFlag}><Flag team={homeTeam} /></span>
        <div className={styles.teams}>
          <span className={`${styles.team} ${homeWin ? styles.teamWin : draw ? styles.teamDraw : styles.teamLoss}`}>
            {homeTeam.shortName ?? homeTeam.name}
          </span>
          <div className={styles.scoreWrap}>
            <span className={`${styles.scoreDigit} ${homeWin ? styles.winNum : draw ? styles.drawNum : ''}`}>{h}</span>
            <span className={styles.scoreDivider}>:</span>
            <span className={`${styles.scoreDigit} ${awayWin ? styles.winNum : draw ? styles.drawNum : ''}`}>{a}</span>
          </div>
          <span className={`${styles.team} ${styles.teamRight} ${awayWin ? styles.teamWin : draw ? styles.teamDraw : styles.teamLoss}`}>
            {awayTeam.shortName ?? awayTeam.name}
          </span>
        </div>
        <span className={styles.teamFlag}><Flag team={awayTeam} /></span>
        <span className={styles.ftTag}>FT</span>
      </button>
    )
  }

  const timeStr = isLive ? 'LIVE' : londonTime(match.utcDate)
  return (
    <button
      className={styles.row}
      onClick={onClick}
      aria-label={`${homeTeam.name} vs ${awayTeam.name}${isLive ? ', live' : `, kick off ${timeStr}`}`}
    >
      <span className={styles.teamFlag}><Flag team={homeTeam} /></span>
      <div className={styles.teams}>
        <span className={styles.team}>{homeTeam.shortName ?? homeTeam.name}</span>
        <div className={`${styles.scoreWrap} ${styles.timeWrap}`}>
          <span className={`${styles.timeText} ${isLive ? styles.timeTextLive : ''}`}>{timeStr}</span>
        </div>
        <span className={`${styles.team} ${styles.teamRight}`}>{awayTeam.shortName ?? awayTeam.name}</span>
      </div>
      <span className={styles.teamFlag}><Flag team={awayTeam} /></span>
      <span className={isLive ? styles.liveTag : styles.koTag}>{isLive ? '●' : 'KO'}</span>
    </button>
  )
}

function EmptyState({ msg }) {
  return (
    <div className={styles.emptyState}>{msg ?? 'No matches for this selection.'}</div>
  )
}

const POLL_KEY = 'wc_winner_vote'
const VOTES_KEY = 'wc_poll_votes'
const FAVORITES = [
  { tla: 'ARG', name: 'Argentina',   flagCode: 'ar' },
  { tla: 'FRA', name: 'France',      flagCode: 'fr' },
  { tla: 'BRA', name: 'Brazil',      flagCode: 'br' },
  { tla: 'GER', name: 'Germany',     flagCode: 'de' },
  { tla: 'ENG', name: 'England',     flagCode: 'gb-eng' },
  { tla: 'ESP', name: 'Spain',       flagCode: 'es' },
  { tla: 'POR', name: 'Portugal',    flagCode: 'pt' },
  { tla: 'NED', name: 'Netherlands', flagCode: 'nl' },
]

function loadVotes() {
  try {
    const stored = JSON.parse(localStorage.getItem(VOTES_KEY) || 'null')
    if (stored && typeof stored === 'object') return stored
  } catch {}
  return Object.fromEntries(FAVORITES.map(f => [f.tla, 0]))
}

function saveVotes(v) {
  try { localStorage.setItem(VOTES_KEY, JSON.stringify(v)) } catch {}
}

function WinnerPoll() {
  const [voted, setVoted] = useState(() => {
    try { return localStorage.getItem(POLL_KEY) } catch { return null }
  })
  const [pollVotes, setPollVotes] = useState(loadVotes)
  const [barsReady, setBarsReady] = useState(false)

  useEffect(() => {
    if (!voted) return
    setBarsReady(false)
    const t = setTimeout(() => setBarsReady(true), 60)
    return () => clearTimeout(t)
  }, [voted])

  function castVote(tla) {
    const prev = voted
    const next = { ...pollVotes }
    if (prev && prev !== tla) next[prev] = Math.max(0, (next[prev] || 0) - 1)
    next[tla] = (next[tla] || 0) + 1
    saveVotes(next)
    setPollVotes(next)
    try { localStorage.setItem(POLL_KEY, tla) } catch {}
    setVoted(tla)
  }

  const votes = FAVORITES.map(f => ({ ...f, votes: pollVotes[f.tla] || 0 }))
  const total = votes.reduce((s, f) => s + f.votes, 0)
  const sorted = [...votes].sort((a, b) => b.votes - a.votes)

  return (
    <div className={styles.winnerPoll}>
      <div className={styles.pollHeader}>
        <h2 className={styles.pollTitle}>
          <span aria-hidden="true">🏆</span> Who will win WC2026?
        </h2>
        <span className={styles.pollVoteCount}>{total.toLocaleString()} {total === 1 ? 'vote' : 'votes'}</span>
      </div>

      {!voted ? (
        <div className={styles.pollChoices}>
          {FAVORITES.map(f => (
            <button key={f.tla} className={styles.pollChoice} onClick={() => castVote(f.tla)}>
              <img src={flagUrl(f.flagCode, 40)} alt={f.tla} className={styles.pollFlag} />
              <span className={styles.pollName}>{f.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.pollResults}>
          {sorted.map(f => {
            const pct = Math.round((f.votes / total) * 100)
            return (
              <div key={f.tla} className={`${styles.pollRow}${voted === f.tla ? ` ${styles.pollRowVoted}` : ''}`}>
                <img src={flagUrl(f.flagCode, 40)} alt={f.tla} className={styles.pollFlag} />
                <span className={styles.pollName}>{f.name}</span>
                <div className={styles.pollBarWrap}>
                  <div className={styles.pollBar} style={{ width: barsReady ? `${pct}%` : '0%' }} />
                </div>
                <span className={styles.pollPct}>{pct}%</span>
                {voted === f.tla && <span className={styles.pollCheck}>✓</span>}
              </div>
            )
          })}
          <button className={styles.pollChange} onClick={() => {
            if (voted) {
              const next = { ...pollVotes, [voted]: Math.max(0, (pollVotes[voted] || 0) - 1) }
              saveVotes(next)
              setPollVotes(next)
            }
            try { localStorage.removeItem(POLL_KEY) } catch {}
            setVoted(null)
          }}>Change vote</button>
        </div>
      )}
    </div>
  )
}

export default function MatchDay() {
  const navigate = useNavigate()

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
  const yd = new Date(now); yd.setDate(yd.getDate() - 1)
  const yesterdayStr = yd.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

  const { data: matchData, loading: matchLoading, error: matchError } = useFetch(
    getMatches,
    { matches: fallbackData.matches, espnFailed: false }
  )
  const [activeGroup, setActiveGroup] = useState('All Groups')
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    if (matchData) {
      setUpdatedAt(new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
      }))
    }
  }, [matchData])

  const allMatches = (matchData?.matches ?? []).filter(m => m.stage === 'GROUP_STAGE')
  const espnUnavailable = matchError || matchData?.espnFailed

  const yesterdayMatches = allMatches.filter(m => londonDateStr(m.utcDate) === yesterdayStr)
  const todayMatches = allMatches.filter(m => londonDateStr(m.utcDate) === todayStr)

  const relevantGroups = [...new Set([
    ...yesterdayMatches.map(m => m.group?.replace('GROUP_', '')),
    ...todayMatches.map(m => m.group?.replace('GROUP_', '')),
  ].filter(Boolean))].sort()

  const groupFilterList = ['All Groups', ...relevantGroups]

  const filterGroup = g => activeGroup === 'All Groups' || g === `GROUP_${activeGroup}`
  const filteredYesterday = yesterdayMatches.filter(m => filterGroup(m.group))
  const filteredToday = todayMatches.filter(m => filterGroup(m.group))

  if (matchLoading) {
    return (
      <div className={styles.outer}>
        <WinnerPoll />
        <div className={styles.loadingState}>Loading match data…</div>
      </div>
    )
  }

  return (
    <div className={styles.outer}>
      <WinnerPoll />
      {relevantGroups.length > 0 && (
        <div className={styles.filterBar} role="toolbar" aria-label="Filter by group">
          {groupFilterList.map(g => (
            <button
              key={g}
              className={`${styles.filterChip}${activeGroup === g ? ` ${styles.filterChipActive}` : ''}`}
              onClick={() => setActiveGroup(g)}
              aria-pressed={activeGroup === g}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className={styles.wrapper}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Yesterday's Results</h2>
            <div className={styles.panelMeta}>
              <span className={styles.dateChip}>{formatDate(yesterdayStr)}</span>
              {updatedAt && <span className={styles.updatedChip}>↻ {updatedAt}</span>}
            </div>
          </div>
          {espnUnavailable && (
            <div className={styles.panelWarning}>
              Live data unavailable · showing cached data
            </div>
          )}
          <div className={styles.list}>
            {filteredYesterday.length > 0
              ? filteredYesterday.map(m => (
                  <MatchItem key={m.id} match={m} onClick={() => navigate('/matches')} />
                ))
              : <EmptyState msg="No results for this group yesterday." />}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Today's Matches</h2>
            <div className={styles.panelMeta}>
              <span className={styles.dateChip}>{formatDate(todayStr)}</span>
            </div>
          </div>
          {espnUnavailable && (
            <div className={styles.panelWarning}>
              Live data unavailable · showing cached data
            </div>
          )}
          <div className={styles.list}>
            {filteredToday.length > 0
              ? filteredToday.map(m => (
                  <MatchItem key={m.id} match={m} onClick={() => navigate('/matches')} />
                ))
              : <EmptyState msg="No matches scheduled today for this group." />}
          </div>
        </div>
      </div>
    </div>
  )
}
