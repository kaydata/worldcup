import { useEffect } from 'react'
import { getFlagCode, flagUrl } from '../../utils/teamFlags'
import styles from './MatchDetail.module.css'

function TeamFlag({ team, size = 'md' }) {
  const code = getFlagCode(team)
  if (!code) return null
  return (
    <img
      src={flagUrl(code, size === 'lg' ? 80 : 40)}
      srcSet={size === 'lg' ? `${flagUrl(code, 160)} 2x` : undefined}
      alt={team.tla ?? ''}
      className={size === 'lg' ? styles.flagLg : styles.flagSm}
    />
  )
}

function ScorerList({ match, scorers, side }) {
  const team = side === 'home' ? match.homeTeam : match.awayTeam
  const list = scorers.filter(s => s.team.id === team.id)
  if (list.length === 0) return <span className={styles.noScorers}>—</span>
  return (
    <ul className={styles.scorerList}>
      {list.map(s => (
        <li key={s.player.id} className={styles.scorerItem}>
          <span className={styles.scorerName}>{s.player.name}</span>
          <span className={styles.scorerGoals}>{s.goals}g</span>
        </li>
      ))}
    </ul>
  )
}

export default function MatchDetail({ match, scorers = [], onClose }) {
  const h = match.score?.fullTime?.home
  const a = match.score?.fullTime?.away
  const groupLetter = match.group?.replace('GROUP_', '') ?? ''

  const date = new Date(match.utcDate).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Match details">
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close match details">✕</button>

        {/* Meta */}
        <p className={styles.meta}>
          Group {groupLetter} · Matchday {match.matchday} · {date}
        </p>

        {/* Score */}
        <div className={styles.scoreRow}>
          <div className={styles.teamBlock}>
            <TeamFlag team={match.homeTeam} size="lg" />
            <span className={styles.teamName}>{match.homeTeam.shortName ?? match.homeTeam.name}</span>
          </div>

          <div className={styles.scoreBlock}>
            <span className={styles.score}>{h ?? '–'}</span>
            <span className={styles.scoreDash}>–</span>
            <span className={styles.score}>{a ?? '–'}</span>
          </div>

          <div className={`${styles.teamBlock} ${styles.teamBlockRight}`}>
            <TeamFlag team={match.awayTeam} size="lg" />
            <span className={styles.teamName}>{match.awayTeam.shortName ?? match.awayTeam.name}</span>
          </div>
        </div>

        <div className={styles.ftBadge}>Full Time</div>

        {/* Scorers section */}
        <div className={styles.scorersSection}>
          <h3 className={styles.scorersHeading}>Tournament Scorers</h3>
          <div className={styles.scorersGrid}>
            <div className={styles.scorersCol}>
              <ScorerList match={match} scorers={scorers} side="home" />
            </div>
            <div className={`${styles.scorersCol} ${styles.scorersColRight}`}>
              <ScorerList match={match} scorers={scorers} side="away" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
