import { useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getStandings } from '../../services/footballApi'
import styles from './TournamentProgress.module.css'

const GROUP_STAGE_TOTAL = 72
// WC2026: 4 teams per group, each plays 3 group-stage matches
const GAMES_PER_TEAM = 3

export default function TournamentProgress() {
  const { data } = useFetch(getStandings, { standings: [] })

  const { played, groupsDone } = useMemo(() => {
    const groups = data?.standings ?? []
    // Sum all teams' playedGames then halve — each match appears once per side
    const allEntries = groups.flatMap(g => g.table ?? [])
    const played = Math.round(
      allEntries.reduce((s, e) => s + (e.playedGames ?? 0), 0) / 2
    )
    // A group is done when every team has played all their group games
    const groupsDone = groups
      .filter(g =>
        (g.table ?? []).length > 0 &&
        (g.table ?? []).every(e => (e.playedGames ?? 0) >= GAMES_PER_TEAM)
      )
      .map(g => g.group?.replace('GROUP_', '') ?? '')
      .filter(Boolean)
      .sort()

    return { played, groupsDone }
  }, [data])

  const pct = Math.round((played / GROUP_STAGE_TOTAL) * 100)

  return (
    <div className={styles.bar} role="status" aria-label={`Group stage: ${played} of ${GROUP_STAGE_TOTAL} matches played`}>
      <div className={styles.inner}>
        <span className={styles.stage}>Group Stage</span>

        <div className={styles.trackWrap}>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <span className={styles.count}>
          <strong>{played}</strong> / {GROUP_STAGE_TOTAL} matches
        </span>

        {groupsDone.length > 0 && (
          <span className={styles.done} aria-label={`Groups completed: ${groupsDone.join(', ')}`}>
            {groupsDone.map(g => (
              <span key={g} className={styles.chip}>{g}</span>
            ))}
            <span className={styles.doneLabel}>complete</span>
          </span>
        )}
      </div>
    </div>
  )
}
