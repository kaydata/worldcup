import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { to: '/overview', label: 'Overview' },
  { to: '/my-team', label: 'My Team' },
  { to: '/stats', label: 'Stats' },
  { to: '/matches', label: 'Matches' },
  { to: '/h2h', label: 'H2H' },
]

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function Navbar({ isDark, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function close() { setMenuOpen(false) }

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <NavLink to="/" className={styles.brand} onClick={close}>
          <img src="/kaymetrics-fav.png" alt="KayMetrics" className={styles.brandLogo} />
        </NavLink>

        <div className={styles.navRight}>
          {/* Desktop links */}
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

          <button
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Hamburger — mobile only */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(m => !m)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="navigation" aria-label="Mobile navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              className={({ isActive }) =>
                `${styles.mobileLink}${isActive ? ` ${styles.mobileLinkActive}` : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
