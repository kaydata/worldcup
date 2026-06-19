import { useState } from 'react'
import { getFlagCode, flagUrl } from '../../utils/teamFlags'
import { getMatchResult } from '../../utils/predictions'
import styles from './MatchRow.module.css'

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED'])

function Flag({ team }) {
  const code = getFlagCode(team)
  if (!code) return null
  return (
    <img
      src={flagUrl(code)}
      srcSet={`${flagUrl(code, 80)} 2x`}
      alt={team.tla ?? ''}
      className={styles.flagImg}
    />
  )
}

const PICK_LABELS = { home: 'H', draw: 'D', away: 'A' }

export default function MatchRow({ match, onClick, prediction, onPredict }) {
  const [showPick, setShowPick] = useState(false)

  const { homeTeam, awayTeam, score, status, utcDate, matchday } = match

  const isFinished = status === 'FINISHED'
  const isLive = LIVE_STATUSES.has(status)
  const isHT = status === 'PAUSED'
  const isScheduled = !isFinished && !isLive

  const h = score?.fullTime?.home
  const a = score?.fullTime?.away

  const _d = new Date(utcDate)
  const kickoff = (_d.getUTCHours() === 0 && _d.getUTCMinutes() === 0)
    ? 'TBC'
    : _d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })

  let statusLabel, statusClass
  if (isLive) {
    statusLabel = isHT ? 'HT' : 'LIVE'
    statusClass = styles.statusLive
  } else if (isFinished) {
    statusLabel = 'FT'
    statusClass = styles.statusFt
  } else {
    statusLabel = `MD${matchday}`
    statusClass = styles.statusUpcoming
  }

  // Prediction result badge for finished matches
  let predResult = null
  if (isFinished && prediction) {
    const result = getMatchResult(match)
    if (result) predResult = prediction.pick === result ? 'correct' : 'wrong'
  }

  function handleRowClick() {
    if (isFinished && onClick) onClick(match)
  }

  return (
    <>
      <div
        className={`${styles.row}${isLive ? ` ${styles.liveRow}` : ''}${isFinished && onClick ? ` ${styles.clickable}` : ''}`}
        onClick={handleRowClick}
        role={isFinished && onClick ? 'button' : undefined}
        tabIndex={isFinished && onClick ? 0 : undefined}
        onKeyDown={isFinished && onClick
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleRowClick() }
          : undefined}
      >
        <span className={styles.teamFlag}>
          <Flag team={homeTeam} />
        </span>

        <span className={styles.home}>
          {homeTeam.shortName ?? homeTeam.name}
        </span>

        <div className={styles.middle}>
          {isFinished || isLive ? (
            <span className={styles.score}>
              {h}<em className={styles.dash}>–</em>{a}
            </span>
          ) : (
            <span className={styles.kickoff}>{kickoff}</span>
          )}
        </div>

        <span className={styles.away}>
          {awayTeam.shortName ?? awayTeam.name}
        </span>

        <span className={styles.teamFlag}>
          <Flag team={awayTeam} />
        </span>

        <div className={styles.statusCell}>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {statusLabel}
          </span>

          {/* Finished + predicted: show ✓ or ✗ */}
          {predResult && (
            <span className={`${styles.predResult} ${predResult === 'correct' ? styles.predCorrect : styles.predWrong}`}>
              {predResult === 'correct' ? '✓' : '✗'}
            </span>
          )}

          {/* Upcoming + no prediction: show Predict button */}
          {isScheduled && !prediction && onPredict && (
            <button
              className={styles.predictBtn}
              onClick={(e) => { e.stopPropagation(); setShowPick(p => !p) }}
              aria-label="Predict match outcome"
            >
              +
            </button>
          )}

          {/* Upcoming + predicted: show pick badge */}
          {isScheduled && prediction && (
            <button
              className={styles.predPick}
              onClick={(e) => { e.stopPropagation(); setShowPick(p => !p) }}
              title="Change prediction"
            >
              {PICK_LABELS[prediction.pick]}
            </button>
          )}
        </div>
      </div>

      {/* Inline pick strip */}
      {showPick && (
        <div className={styles.pickStrip}>
          <button
            className={`${styles.pickBtn} ${prediction?.pick === 'home' ? styles.pickBtnActive : ''}`}
            onClick={() => { onPredict('home'); setShowPick(false) }}
          >
            {homeTeam.shortName ?? homeTeam.name}
          </button>
          <button
            className={`${styles.pickBtn} ${prediction?.pick === 'draw' ? styles.pickBtnActive : ''}`}
            onClick={() => { onPredict('draw'); setShowPick(false) }}
          >
            Draw
          </button>
          <button
            className={`${styles.pickBtn} ${prediction?.pick === 'away' ? styles.pickBtnActive : ''}`}
            onClick={() => { onPredict('away'); setShowPick(false) }}
          >
            {awayTeam.shortName ?? awayTeam.name}
          </button>
          <button
            className={styles.pickCancel}
            onClick={() => setShowPick(false)}
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
