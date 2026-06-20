import { flagUrl } from '../../utils/teamFlags'
import styles from './Hero.module.css'

const STATS = [
  { label: 'Teams', value: '48' },
  { label: 'Groups', value: '12' },
  { label: 'Matches', value: '104' },
  { label: 'Hosts', value: '3' },
]

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.stageBadge}>
          <span className={styles.liveDot} aria-hidden="true" />
          Group Stage · In Progress
        </div>
        <h1 className={styles.title}>FIFA World Cup 2026™</h1>
        <p className={styles.subtitle}>
          Live standings, match results, and player stats, all in one place.
        </p>
        <div className={styles.hosts}>
          <span className={styles.host}>
            <img src={flagUrl('us', 20)} srcSet={`${flagUrl('us', 40)} 2x`} alt="USA" className={styles.hostFlag} />
            USA
          </span>
          <span className={styles.hostSep}>·</span>
          <span className={styles.host}>
            <img src={flagUrl('ca', 20)} srcSet={`${flagUrl('ca', 40)} 2x`} alt="Canada" className={styles.hostFlag} />
            Canada
          </span>
          <span className={styles.hostSep}>·</span>
          <span className={styles.host}>
            <img src={flagUrl('mx', 20)} srcSet={`${flagUrl('mx', 40)} 2x`} alt="Mexico" className={styles.hostFlag} />
            Mexico
          </span>
        </div>
        <div className={styles.stats}>
          {STATS.map(({ label, value }) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
