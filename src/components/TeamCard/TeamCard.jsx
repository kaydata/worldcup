import styles from './TeamCard.module.css'

export default function TeamCard({ team, matches, expanded, onClick }) {
  const {
    team: info,
    playedGames,
    won,
    draw,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
    groupLetter,
  } = team

  return (
    <div
      className={`${styles.card}${expanded ? ` ${styles.expanded}` : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      aria-expanded={expanded}
    >
      <div className={styles.header}>
        <div className={styles.identity}>
          {info.crest ? (
            <img src={info.crest} alt="" className={styles.crest} loading="lazy" />
          ) : (
            <span className={styles.tla}>{info.tla}</span>
          )}
          <div className={styles.meta}>
            <span className={styles.name}>{info.name}</span>
            <span className={styles.groupBadge}>Group {groupLetter}</span>
          </div>
        </div>

        <div className={styles.stats}>
          <StatCell label="Pts" value={points} accent />
          <StatCell label="W" value={won} />
          <StatCell label="D" value={draw} />
          <StatCell label="L" value={lost} />
          <StatCell
            label="GD"
            value={goalDifference > 0 ? `+${goalDifference}` : goalDifference}
          />
        </div>

        <span
          className={`${styles.chevron}${expanded ? ` ${styles.chevronOpen}` : ''}`}
          aria-hidden="true"
        />
      </div>

      {expanded && (
        <div className={styles.details}>
          <div className={styles.detailsSummary}>
            <span>Played <strong>{playedGames}</strong></span>
            <span>GF <strong>{goalsFor}</strong></span>
            <span>GA <strong>{goalsAgainst}</strong></span>
          </div>

          {matches.length === 0 ? (
            <p className={styles.noMatches}>No matches played yet</p>
          ) : (
            <ul className={styles.matchList}>
              {matches.map(match => (
                <MatchRow key={match.id} match={match} teamId={info.id} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function StatCell({ label, value, accent }) {
  return (
    <div className={styles.stat}>
      <span className={`${styles.statValue}${accent ? ` ${styles.statAccent}` : ''}`}>
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function MatchRow({ match, teamId }) {
  const isHome = match.homeTeam.id === teamId
  const opponent = isHome ? match.awayTeam : match.homeTeam
  const home = match.score?.fullTime?.home
  const away = match.score?.fullTime?.away

  let result = null
  if (home != null && away != null && match.status === 'FINISHED') {
    const myScore  = isHome ? home : away
    const oppScore = isHome ? away : home
    if (myScore > oppScore) result = 'W'
    else if (myScore < oppScore) result = 'L'
    else result = 'D'
  }

  const scoreStr =
    home != null ? (isHome ? `${home}–${away}` : `${away}–${home}`) : null

  const dateStr = new Date(match.utcDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <li className={styles.matchRow}>
      {result && (
        <span className={`${styles.result} ${styles[result.toLowerCase()]}`}>
          {result}
        </span>
      )}
      <span className={styles.venue}>{isHome ? 'vs' : '@'}</span>
      <span className={styles.opponent}>{opponent.shortName ?? opponent.name}</span>
      {scoreStr && <span className={styles.score}>{scoreStr}</span>}
      <span className={styles.matchDate}>{dateStr}</span>
    </li>
  )
}
