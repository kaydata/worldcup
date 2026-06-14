import styles from './GroupFilter.module.css'

export default function GroupFilter({ groups, active, onChange }) {
  return (
    <div className={styles.filter} role="group" aria-label="Filter by group">
      <button
        className={`${styles.btn}${active === 'ALL' ? ` ${styles.active}` : ''}`}
        onClick={() => onChange('ALL')}
      >
        All Groups
      </button>
      {groups.map(letter => (
        <button
          key={letter}
          className={`${styles.btn}${active === letter ? ` ${styles.active}` : ''}`}
          onClick={() => onChange(letter)}
        >
          Group {letter}
        </button>
      ))}
    </div>
  )
}
