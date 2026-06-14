import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { getStandings, getMatches } from '../services/footballApi'
import GroupFilter from '../components/GroupFilter/GroupFilter'
import TeamCard from '../components/TeamCard/TeamCard'
import fallbackData from '../data/fallback.json'
import styles from './Teams.module.css'

export default function Teams() {
  const { data: standingsData, loading } = useFetch(getStandings, fallbackData)
  const { data: matchesData } = useFetch(getMatches, { matches: fallbackData.matches })

  const [activeGroup, setActiveGroup] = useState('ALL')
  const [expandedId, setExpandedId] = useState(null)

  const groups = (standingsData?.standings ?? []).filter(
    s => s.stage === 'GROUP_STAGE' && s.type === 'TOTAL'
  )

  const allTeams = groups.flatMap(group =>
    group.table.map(row => ({
      ...row,
      groupLetter: group.group.replace('GROUP_', ''),
    }))
  )

  const groupLetters = groups.map(g => g.group.replace('GROUP_', ''))
  const matches = matchesData?.matches ?? []

  const visible =
    activeGroup === 'ALL'
      ? allTeams
      : allTeams.filter(t => t.groupLetter === activeGroup)

  function getTeamMatches(teamId) {
    return matches.filter(
      m => m.homeTeam.id === teamId || m.awayTeam.id === teamId
    )
  }

  function toggleExpand(id) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  function handleGroupChange(group) {
    setActiveGroup(group)
    setExpandedId(null)
  }

  if (loading) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Loading" />
        <p className={styles.loadingText}>Loading teams…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Teams</h2>
        <span className={styles.count}>{visible.length} of 48 teams</span>
      </div>

      <GroupFilter groups={groupLetters} active={activeGroup} onChange={handleGroupChange} />

      <div className={styles.grid}>
        {visible.map(team => (
          <TeamCard
            key={team.team.id}
            team={team}
            matches={getTeamMatches(team.team.id)}
            expanded={expandedId === team.team.id}
            onClick={() => toggleExpand(team.team.id)}
          />
        ))}
      </div>
    </div>
  )
}
