import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { getStandings } from '../services/footballApi'
import GroupStandings from '../components/GroupStandings/GroupStandings'
import GroupFilter from '../components/GroupFilter/GroupFilter'
import fallbackData from '../data/fallback.json'
import styles from './Overview.module.css'

export default function Overview() {
  const { data, loading, error } = useFetch(getStandings, fallbackData)
  const [activeGroup, setActiveGroup] = useState('ALL')

  const groups = (data?.standings ?? []).filter(
    s => s.stage === 'GROUP_STAGE' && s.type === 'TOTAL'
  )
  const groupLetters = groups.map(g => g.group.replace('GROUP_', ''))

  const visible =
    activeGroup === 'ALL'
      ? groups
      : groups.filter(g => g.group === `GROUP_${activeGroup}`)

  if (loading) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Loading" />
        <p className={styles.loadingText}>Fetching standings…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Group Standings</h2>
        {error && (
          <p className={styles.fallbackNote}>
            Live data unavailable — showing cached standings
          </p>
        )}
      </div>

      {groupLetters.length > 0 && (
        <GroupFilter
          groups={groupLetters}
          active={activeGroup}
          onChange={setActiveGroup}
        />
      )}

      {visible.length === 0 ? (
        <div className={styles.centered}>
          <p className={styles.empty}>No standings data available yet.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map(group => (
            <GroupStandings key={group.group} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
