import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import TournamentProgress from './components/TournamentProgress/TournamentProgress'
import Footer from './components/Footer/Footer'
import Home from './pages/Home'
import Overview from './pages/Overview'
import MyTeam from './pages/MyTeam'
import Players from './pages/Players'
import Matches from './pages/Matches'
import Compare from './pages/Compare'
import styles from './App.module.css'

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Navbar isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
        <TournamentProgress />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/my-team" element={<MyTeam />} />
            <Route path="/players" element={<Players />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/h2h" element={<Compare />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
