import { getFlagCode, flagUrl } from '../../utils/teamFlags'
import styles from './ScorerTable.module.css'

export default function ScorerTable({ scorers, sortBy }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thRank}>#</th>
            <th className={styles.thPlayer}>Player</th>
            <th className={styles.thTeam}>Team</th>
            <th
              className={`${styles.thStat}${sortBy === 'goals' ? ` ${styles.thActive}` : ''}`}
              title="Goals"
            >
              G
            </th>
            <th
              className={`${styles.thStat}${sortBy === 'assists' ? ` ${styles.thActive}` : ''}`}
              title="Assists"
            >
              A
            </th>
            <th className={styles.thStat} title="Penalties scored">
              Pen
            </th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((s, i) => {
            const rankClass =
              i === 0 ? styles.rankGold
              : i === 1 ? styles.rankSilver
              : i === 2 ? styles.rankBronze
              : ''

            return (
              <tr key={s.player.id} className={i < 3 ? styles.topThree : ''}>
                <td className={styles.rankCell}>
                  <span className={`${styles.rank} ${rankClass}`}>{i + 1}</span>
                </td>

                <td className={styles.playerCell}>
                  <span className={styles.playerName}>{s.player.name}</span>
                  {s.player.position && (
                    <span className={styles.position}>{s.player.position}</span>
                  )}
                </td>

                <td className={styles.teamCell}>
                  {getFlagCode(s.team) ? (
                    <img
                      src={flagUrl(getFlagCode(s.team))}
                      srcSet={`${flagUrl(getFlagCode(s.team), 80)} 2x`}
                      alt={s.team.tla}
                      className={styles.flagImg}
                    />
                  ) : (
                    <span className={styles.tla}>{s.team.tla}</span>
                  )}
                  <span className={styles.teamName}>
                    {s.team.shortName ?? s.team.name}
                  </span>
                </td>

                <td
                  className={`${styles.stat}${sortBy === 'goals' ? ` ${styles.statActive}` : ''}`}
                >
                  {s.goals ?? 0}
                </td>

                <td
                  className={`${styles.stat}${sortBy === 'assists' ? ` ${styles.statActive}` : ''}`}
                >
                  {s.assists ?? 0}
                </td>

                <td className={styles.stat}>{s.penalties ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
