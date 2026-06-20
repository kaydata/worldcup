import { useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getMatches } from '../../services/footballApi'
import fallback from '../../data/fallback.json'
import styles from './TournamentProgress.module.css'

const GROUP_STAGE_TOTAL = 72
const MATCHES_PER_GROUP = 6

export default function TournamentProgress() {
  const { data } = useFetch(getMatches, { matches: fallback.matches })

  const { played, groupsDone } = useMemo(() => {
    const matches = (data?.matches ?? []).filter(m => m.stage === 'GROUP_STAGE')
    const played = matches.filter(m => m.status === 'FINISHED').length

    // A group is complete when all 6 of its matches are finished
    const countByGroup = {}
    for (const m of matches) {
      if (!m.group) continue
      if (!countByGroup[m.group]) countByGroup[m.group] = 0
      if (m.status === 'FINISHED') countByGroup[m.group]++
    }
    const groupsDone = Object.entries(countByGroup)
      .filter(([, n]) => n >= MATCHES_PER_GROUP)
      .map(([g]) => g.replace('GROUP_', ''))
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
