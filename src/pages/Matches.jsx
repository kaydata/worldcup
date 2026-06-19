import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { getMatches, getScorers, invalidateMatches } from '../services/footballApi'
import { getPredictions, savePrediction, getTotalScore } from '../utils/predictions'
import GroupFilter from '../components/GroupFilter/GroupFilter'
import MatchRow from '../components/MatchRow/MatchRow'
import MatchDetail from '../components/MatchDetail/MatchDetail'
import fallbackData from '../data/fallback.json'
import styles from './Matches.module.css'

const STATUS_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Played', value: 'PLAYED' },
]

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED'])
const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED'])
const PLAYED_STATUSES = new Set(['FINISHED'])

export default function Matches() {
  const { data, loading, error, refresh } = useFetch(
    getMatches,
    { matches: fallbackData.matches }
  )
  const { data: scorersData } = useFetch(
    getScorers,
    { scorers: fallbackData.scorers }
  )

  const [activeGroup, setActiveGroup] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [predictions, setPredictions] = useState(() => getPredictions())

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
  const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

  const allMatches = (data?.matches ?? []).filter(m => m.stage === 'GROUP_STAGE')
  const scorers = scorersData?.scorers ?? []

  const groupLetters = [...new Set(
    allMatches.map(m => m.group?.replace('GROUP_', '')).filter(Boolean)
  )].sort()

  const visible = allMatches.filter(m => {
    const groupMatch = activeGroup === 'ALL' || m.group === `GROUP_${activeGroup}`
    const statusMatch =
      statusFilter === 'ALL' ||
      (statusFilter === 'LIVE' && LIVE_STATUSES.has(m.status)) ||
      (statusFilter === 'UPCOMING' && UPCOMING_STATUSES.has(m.status)) ||
      (statusFilter === 'PLAYED' && PLAYED_STATUSES.has(m.status))
    return groupMatch && statusMatch
  })

  // Group by calendar date (UTC)
  const byDate = {}
  visible.forEach(m => {
    const key = m.utcDate.slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(m)
  })
  const dates = Object.keys(byDate).sort()

  const predScore = getTotalScore(predictions, allMatches)

  function handleRefresh() {
    invalidateMatches()
    refresh()
  }

  function handlePredict(matchId, pick) {
    savePrediction(matchId, pick)
    setPredictions(getPredictions())
  }

  if (loading) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Loading" />
        <p className={styles.loadingText}>Loading matches…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Matches</h2>
          {error && (
            <span className={styles.fallbackNote}>Showing cached data</span>
          )}
        </div>
        <button className={styles.refreshBtn} onClick={handleRefresh}>
          ↻ Refresh
        </button>
      </div>

      {predScore.total > 0 && (
        <div className={styles.predScore}>
          <span className={styles.predScoreText}>
            Your predictions: <strong>{predScore.correct}/{predScore.total}</strong> correct
          </span>
          <span className={styles.predScorePoints}>
            {predScore.points} pt{predScore.points !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.statusTabs} role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value}
              role="tab"
              aria-selected={statusFilter === value}
              className={`${styles.tab}${statusFilter === value ? ` ${styles.tabActive}` : ''}`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <GroupFilter groups={groupLetters} active={activeGroup} onChange={setActiveGroup} />
      </div>

      {dates.length === 0 ? (
        <div className={styles.empty}>
          <p>No matches found for the selected filters.</p>
        </div>
      ) : (
        <div className={styles.matchList}>
          {dates.map(date => (
            <div key={date} className={styles.dateGroup}>
              <h3 className={styles.dateHeader}>
                {date === todayStr
                  ? 'Today'
                  : date === tomorrowStr
                  ? 'Tomorrow'
                  : new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      timeZone: 'Europe/London',
                    })}
              </h3>
              <div className={styles.matchCard}>
                {byDate[date].map(match => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    onClick={match.status === 'FINISHED' ? setSelectedMatch : undefined}
                    prediction={predictions[match.id] ?? null}
                    onPredict={(pick) => handlePredict(match.id, pick)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMatch && (
        <MatchDetail
          match={selectedMatch}
          scorers={scorers}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}
