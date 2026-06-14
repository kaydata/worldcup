import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home'
import Overview from './pages/Overview'
import MyTeam from './pages/MyTeam'
import Players from './pages/Players'
import Matches from './pages/Matches'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/my-team" element={<MyTeam />} />
            <Route path="/players" element={<Players />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
