import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { getMatches, getScorers } from '../../services/footballApi'
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

function GoldenBoot({ scorers }) {
  if (!scorers.length) return null
  return (
    <div className={styles.goldenBoot}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span className={styles.bootIcon} aria-hidden="true">🥾</span>
          Golden Boot Race
        </h2>
        <span className={styles.dateChip}>Top {scorers.length} Scorers</span>
      </div>
      <div className={styles.scorerList}>
        {scorers.map((s, i) => (
          <div key={s.player.id} className={styles.scorerRow}>
            <span className={`${styles.rank} ${
              i === 0 ? styles.rankGold :
              i === 1 ? styles.rankSilver :
              i === 2 ? styles.rankBronze : ''
            }`}>{i + 1}</span>
            <span className={styles.scorerFlag}>
              <FlagLg team={s.team} />
            </span>
            <div className={styles.scorerInfo}>
              <span className={styles.scorerName}>{s.player.name}</span>
              <span className={styles.scorerCountry}>{s.team.shortName ?? s.team.name}</span>
            </div>
            <div className={styles.scorerStats}>
              <span className={styles.goals}>{s.goals ?? 0}</span>
              <span className={styles.goalLabel}>G</span>
              <span className={styles.statDivider} aria-hidden="true" />
              <span className={styles.assists}>{s.assists ?? 0}</span>
              <span className={styles.assistLabel}>A</span>
            </div>
          </div>
        ))}
      </div>
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
  const { data: scorersData } = useFetch(
    getScorers,
    { scorers: fallbackData.scorers }
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

  const topScorers = (scorersData?.scorers ?? []).slice(0, 5)

  if (matchLoading) {
    return (
      <div className={styles.outer}>
        <div className={styles.loadingState}>Loading match data…</div>
      </div>
    )
  }

  return (
    <div className={styles.outer}>
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

      <GoldenBoot scorers={topScorers} />
    </div>
  )
}
