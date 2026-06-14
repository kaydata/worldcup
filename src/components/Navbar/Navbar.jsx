import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { to: '/overview', label: 'Overview' },
  { to: '/my-team', label: 'My Team' },
  { to: '/players', label: 'Players' },
  { to: '/matches', label: 'Matches' },
]

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <NavLink to="/" className={styles.brand}>
          KayMetrics
        </NavLink>
        <ul className={styles.links}>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${styles.link}${isActive ? ` ${styles.active}` : ''}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
