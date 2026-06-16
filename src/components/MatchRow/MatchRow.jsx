import { getFlagCode, flagUrl } from '../../utils/teamFlags'
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

export default function MatchRow({ match }) {
  const { homeTeam, awayTeam, score, status, utcDate, matchday } = match

  const isFinished = status === 'FINISHED'
  const isLive = LIVE_STATUSES.has(status)
  const isHT = status === 'PAUSED'

  const h = score?.fullTime?.home
  const a = score?.fullTime?.away

  const kickoff = new Date(utcDate).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

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

  return (
    <div className={`${styles.row}${isLive ? ` ${styles.liveRow}` : ''}`}>
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

      <span className={`${styles.statusBadge} ${statusClass}`}>
        {statusLabel}
      </span>
    </div>
  )
}
