import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.eyebrow}>KayMetrics</span>
        <h1 className={styles.title}>World Cup Dashboard</h1>
        <p className={styles.subtitle}>
          Live standings, match results, and player stats — all in one place.
        </p>
      </div>
    </section>
  )
}
