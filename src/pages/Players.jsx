import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { getScorers } from '../services/footballApi'
import ScorerTable from '../components/ScorerTable/ScorerTable'
import fallbackData from '../data/fallback.json'
import styles from './Players.module.css'

const SORT_MODES = [
  { label: 'Goals', value: 'goals' },
  { label: 'Assists', value: 'assists' },
]

export default function Players() {
  const { data, loading, error } = useFetch(getScorers, fallbackData)
  const [sortBy, setSortBy] = useState('goals')
  const [search, setSearch] = useState('')

  const scorers = (data?.scorers ?? [])
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        s.player.name.toLowerCase().includes(q) ||
        (s.team.name ?? '').toLowerCase().includes(q) ||
        (s.player.nationality ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) =>
      sortBy === 'goals'
        ? (b.goals ?? 0) - (a.goals ?? 0)
        : (b.assists ?? 0) - (a.assists ?? 0)
    )

  if (loading) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Loading" />
        <p className={styles.loadingText}>Loading players…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Players</h2>
        {error && (
          <span className={styles.fallbackNote}>Showing cached data</span>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.sortTabs} role="tablist" aria-label="Sort by">
          {SORT_MODES.map(({ label, value }) => (
            <button
              key={value}
              role="tab"
              aria-selected={sortBy === value}
              className={`${styles.tab}${sortBy === value ? ` ${styles.tabActive}` : ''}`}
              onClick={() => setSortBy(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search player or team…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.search}
          aria-label="Search players"
        />
      </div>

      <p className={styles.meta}>
        {scorers.length === 0
          ? ''
          : `${scorers.length} player${scorers.length !== 1 ? 's' : ''} · sorted by ${sortBy}`}
      </p>

      {scorers.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {search
              ? 'No players match your search.'
              : 'No scorer data available yet — matches may not have started.'}
          </p>
        </div>
      ) : (
        <ScorerTable scorers={scorers} sortBy={sortBy} />
      )}
    </div>
  )
}
