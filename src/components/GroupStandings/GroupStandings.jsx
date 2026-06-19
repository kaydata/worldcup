import { getFlagCode, FLAG_COLORS, flagUrl } from '../../utils/teamFlags'
import styles from './GroupStandings.module.css'

const QUALIFYING_SPOTS = 2

export default function GroupStandings({ group }) {
  const letter = group.group.replace('GROUP_', '')

  return (
    <div className={styles.card}>
      <h3 className={styles.groupTitle}>Group {letter}</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thPos}>#</th>
              <th className={styles.thTeam}>Team</th>
              <th title="Played">P</th>
              <th title="Won">W</th>
              <th title="Drawn">D</th>
              <th title="Lost">L</th>
              <th title="Goals For">GF</th>
              <th title="Goals Against">GA</th>
              <th title="Goal Difference">GD</th>
              <th className={styles.thPts} title="Points">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.table.map(row => {
              const flagCode = getFlagCode(row.team)
              const flagColor = FLAG_COLORS[row.team.id]

              return (
                <tr
                  key={row.team.id}
                  className={row.position <= QUALIFYING_SPOTS ? styles.qualifying : ''}
                  style={flagColor ? { '--flag-color': flagColor } : undefined}
                >
                  <td className={styles.pos}>{row.position}</td>
                  <td className={styles.teamCell}>
                    {row.team.crest ? (
                      <img
                        src={row.team.crest}
                        alt=""
                        className={styles.crest}
                        loading="lazy"
                      />
                    ) : flagCode ? (
                      <img
                        src={flagUrl(flagCode, 40)}
                        alt=""
                        aria-hidden="true"
                        className={styles.flagImg}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.crestPlaceholder}>
                        {row.team.tla?.slice(0, 2) ?? '??'}
                      </span>
                    )}
                    <span className={styles.teamName}>
                      {row.team.shortName ?? row.team.name}
                    </span>
                  </td>
                  <td>{row.playedGames}</td>
                  <td>{row.won}</td>
                  <td>{row.draw}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td
                    className={
                      row.goalDifference > 0
                        ? styles.positive
                        : row.goalDifference < 0
                        ? styles.negative
                        : ''
                    }
                  >
                    {row.goalDifference > 0
                      ? `+${row.goalDifference}`
                      : row.goalDifference}
                  </td>
                  <td className={styles.pts}>{row.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>
        Top 2 advance · 8 best 3rd-place teams also qualify
      </p>
    </div>
  )
}
