import { useState, useEffect } from 'react'
import { useFetch } from '../hooks/useFetch'
import { getMatches } from '../services/footballApi'
import { flagUrl, getFlagCode } from '../utils/teamFlags'
import statsData from '../data/stats.json'
import fallbackData from '../data/fallback.json'
import styles from './Stats.module.css'

// ── Count-up animation ─────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setVal((1 - Math.pow(1 - t, 3)) * target)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setVal(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

function fmtAnimated(anim, raw) {
  if (raw >= 1_000_000) return (anim / 1_000_000).toFixed(2) + 'M'
  if (typeof raw === 'number' && !Number.isInteger(raw)) return anim.toFixed(1)
  return Math.round(anim).toLocaleString()
}

// ── Tournament KPI card ────────────────────────────────────────────────
function StatCard({ icon, label, value, suffix, delay }) {
  const anim = useCountUp(value)
  return (
    <div className={styles.kpiCard} style={{ animationDelay: `${delay ?? 0}ms` }}>
      <span className={styles.kpiIcon}>{icon}</span>
      <span className={styles.kpiValue}>
        {fmtAnimated(anim, value)}{suffix ?? ''}
      </span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  )
}

// ── Leaderboard row ────────────────────────────────────────────────────
function LbRow({ rank, flagCode, name, badge, value, maxValue, unit, ready }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  const displayVal = typeof value === 'number' && !Number.isInteger(value)
    ? value.toFixed(1) : value

  return (
    <div className={styles.lbRow}>
      <span className={styles.lbRank}>{rank}</span>
      <img src={flagUrl(flagCode, 40)} alt="" className={styles.lbFlag}
        onError={e => { e.currentTarget.style.display = 'none' }} />
      <span className={styles.lbName}>{name}</span>
      <span className={styles.lbBadge}>{badge}</span>
      <div className={styles.lbBarWrap}>
        <div className={styles.lbBar} style={{ width: ready ? `${pct}%` : '0%' }} />
      </div>
      <span className={styles.lbValue}>{displayVal}{unit}</span>
    </div>
  )
}

// ── Pill / tab helpers ─────────────────────────────────────────────────
function Pills({ options, active, onChange }) {
  return (
    <div className={styles.pills}>
      {options.map(o => (
        <button key={o.key}
          className={`${styles.pill}${active === o.key ? ` ${styles.pillActive}` : ''}`}
          onClick={() => onChange(o.key)}>{o.label}</button>
      ))}
    </div>
  )
}

function SubTabs({ tabs, active, onChange }) {
  return (
    <div className={styles.subTabs}>
      {tabs.map(t => (
        <button key={t.id}
          className={`${styles.subTab}${active === t.id ? ` ${styles.subTabActive}` : ''}`}
          onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  )
}

// ─── TEAM STATS ────────────────────────────────────────────────────────

const TEAM_TABS = [
  { id: 'attack',     label: 'Attack',     defaultMetric: 'goals',       metrics: [
    { key: 'goals',         label: 'Goals',         unit: '' },
    { key: 'shots',         label: 'Shots',         unit: '' },
    { key: 'shotsOnTarget', label: 'On Target',     unit: '' },
    { key: 'xg',            label: 'xG',            unit: '' },
    { key: 'bigChances',    label: 'Big Chances',   unit: '' },
    { key: 'corners',       label: 'Corners',       unit: '' },
  ]},
  { id: 'defence',    label: 'Defence',    defaultMetric: 'cleanSheets', metrics: [
    { key: 'cleanSheets',   label: 'Clean Sheets',  unit: '' },
    { key: 'tackles',       label: 'Tackles',       unit: '' },
    { key: 'interceptions', label: 'Interceptions', unit: '' },
    { key: 'saves',         label: 'Saves',         unit: '' },
  ]},
  { id: 'discipline', label: 'Discipline', defaultMetric: 'fouls',       metrics: [
    { key: 'fouls',       label: 'Fouls',        unit: '' },
    { key: 'yellowCards', label: 'Yellow Cards', unit: '' },
    { key: 'redCards',    label: 'Red Cards',    unit: '' },
  ]},
  { id: 'possession', label: 'Possession', defaultMetric: 'possession',  metrics: [
    { key: 'possession',      label: 'Possession',       unit: '%' },
    { key: 'passAccuracy',    label: 'Pass Accuracy',    unit: '%' },
    { key: 'completedPasses', label: 'Completed Passes', unit: '' },
  ]},
]

function TeamSection({ teams }) {
  const [tabId, setTabId]   = useState('attack')
  const [metric, setMetric] = useState('goals')
  const [ready, setReady]   = useState(false)
  const tab       = TEAM_TABS.find(t => t.id === tabId)
  const metricDef = tab.metrics.find(m => m.key === metric) ?? tab.metrics[0]

  useEffect(() => { setMetric(TEAM_TABS.find(t => t.id === tabId).defaultMetric) }, [tabId])
  useEffect(() => { setReady(false); const id = setTimeout(() => setReady(true), 60); return () => clearTimeout(id) }, [metric])

  const rows   = [...teams].filter(t => t[metric] != null).sort((a, b) => b[metric] - a[metric]).slice(0, 8)
  const maxVal = rows[0]?.[metric] ?? 1

  return (
    <div>
      <SubTabs tabs={TEAM_TABS} active={tabId} onChange={setTabId} />
      <Pills options={tab.metrics} active={metric} onChange={setMetric} />
      <div className={styles.leaderboard}>
        {rows.map((team, i) => (
          <LbRow key={team.tla} rank={i + 1} flagCode={team.flagCode} name={team.name}
            badge={team.tla} value={team[metric]} maxValue={maxVal} unit={metricDef.unit} ready={ready} />
        ))}
        {rows.length === 0 && <p className={styles.lbEmpty}>No data available yet</p>}
      </div>
    </div>
  )
}

// ─── PLAYER STATS ──────────────────────────────────────────────────────

const PLAYER_TABS = [
  { id: 'goals',       label: 'Goals',       defaultMetric: 'goals',        metrics: [
    { key: 'goals',          label: 'Goals',           unit: '' },
    { key: 'goalsPerNinety', label: 'Goals / 90',      unit: '' },
    { key: 'shotsOnTarget',  label: 'Shots on Target', unit: '' },
  ]},
  { id: 'creativity',  label: 'Creativity',  defaultMetric: 'assists',      metrics: [
    { key: 'assists',        label: 'Assists',          unit: '' },
    { key: 'chancesCreated', label: 'Chances Created',  unit: '' },
    { key: 'keyPasses',      label: 'Key Passes',       unit: '' },
  ]},
  { id: 'goalkeeping', label: 'Goalkeeping', defaultMetric: 'saves',        metrics: [
    { key: 'saves',             label: 'Saves',        unit: '' },
    { key: 'savePercent',       label: 'Save %',       unit: '%' },
    { key: 'keeperCleanSheets', label: 'Clean Sheets', unit: '' },
  ]},
  { id: 'defence',     label: 'Defence',     defaultMetric: 'tackles',      metrics: [
    { key: 'tackles',       label: 'Tackles',       unit: '' },
    { key: 'interceptions', label: 'Interceptions', unit: '' },
    { key: 'recoveries',    label: 'Recoveries',    unit: '' },
  ]},
  { id: 'discipline',  label: 'Discipline',  defaultMetric: 'yellowCards',  metrics: [
    { key: 'yellowCards',    label: 'Yellow Cards',    unit: '' },
    { key: 'foulsCommitted', label: 'Fouls Committed', unit: '' },
  ]},
]

function PlayerSection({ players }) {
  const [tabId, setTabId]   = useState('goals')
  const [metric, setMetric] = useState('goals')
  const [ready, setReady]   = useState(false)
  const tab       = PLAYER_TABS.find(t => t.id === tabId)
  const metricDef = tab.metrics.find(m => m.key === metric) ?? tab.metrics[0]

  useEffect(() => { setMetric(PLAYER_TABS.find(t => t.id === tabId).defaultMetric) }, [tabId])
  useEffect(() => { setReady(false); const id = setTimeout(() => setReady(true), 60); return () => clearTimeout(id) }, [metric])

  const filtered = players.filter(p => {
    if (tabId === 'goalkeeping') return p.saves != null
    if (tabId === 'defence')     return p.saves == null
    return true
  })
  const rows   = [...filtered].filter(p => p[metric] != null && p[metric] > 0).sort((a, b) => b[metric] - a[metric]).slice(0, 8)
  const maxVal = rows[0]?.[metric] ?? 1

  return (
    <div>
      <SubTabs tabs={PLAYER_TABS} active={tabId} onChange={setTabId} />
      <Pills options={tab.metrics} active={metric} onChange={setMetric} />
      <div className={styles.leaderboard}>
        {rows.map((p, i) => (
          <LbRow key={p.name + p.tla} rank={i + 1} flagCode={p.flagCode} name={p.name}
            badge={p.tla} value={p[metric]} maxValue={maxVal} unit={metricDef.unit} ready={ready} />
        ))}
        {rows.length === 0 && <p className={styles.lbEmpty}>No data available yet</p>}
      </div>
    </div>
  )
}

// ─── TOURNAMENT OVERVIEW ───────────────────────────────────────────────

const KPI_CARDS = [
  { icon: '⚽', label: 'Total Goals',       key: 'totalGoals' },
  { icon: '🏟️', label: 'Matches Played',    key: 'matchesPlayed' },
  { icon: '📊', label: 'Avg Goals / Match', key: 'avgGoals',
    compute: t => +(t.totalGoals / t.matchesPlayed).toFixed(2) },
  { icon: '🔶', label: 'Fouls Committed',   key: 'totalFouls' },
  { icon: '🟨', label: 'Yellow Cards',      key: 'yellowCards' },
  { icon: '🟥', label: 'Red Cards',         key: 'redCards' },
  { icon: '🎯', label: 'Penalties Awarded', key: 'penaltiesAwarded' },
  { icon: '✅', label: 'Penalties Scored',  key: 'penaltiesScored' },
  { icon: '↩️', label: 'Own Goals',         key: 'ownGoals' },
  { icon: '🛡️', label: 'Clean Sheets',      key: 'cleanSheets' },
  { icon: '👥', label: 'Total Attendance',  key: 'totalAttendance' },
  { icon: '🔄', label: 'Avg Possession',    key: 'avgPossession', suffix: '%' },
]

function TournamentSection({ tournament }) {
  return (
    <div className={styles.kpiGrid}>
      {KPI_CARDS.map((card, i) => {
        const val = card.compute ? card.compute(tournament) : tournament[card.key]
        return <StatCard key={card.key} icon={card.icon} label={card.label} value={val} suffix={card.suffix} delay={i * 35} />
      })}
    </div>
  )
}

// ─── MATCH PREDICTOR ──────────────────────────────────────────────────

const PRED_KEY = 'wc_predictions'
const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE', 'HALFTIME'])

function loadPreds() {
  try { return JSON.parse(localStorage.getItem(PRED_KEY) ?? '{}') } catch { return {} }
}
function storePreds(obj) {
  try { localStorage.setItem(PRED_KEY, JSON.stringify(obj)) } catch {}
}

function MatchPredictor({ matches }) {
  const [preds, setPreds] = useState(loadPreds)
  const [touched, setTouched] = useState(() => new Set(Object.keys(loadPreds())))

  const upcoming = (matches ?? [])
    .filter(m => m.status !== 'FINISHED' && !LIVE.has(m.status))
    .slice(0, 8)

  function step(id, side, delta) {
    const current = preds[id] ?? { home: 0, away: 0 }
    const next = {
      ...preds,
      [id]: {
        home: current.home ?? 0,
        away: current.away ?? 0,
        [side]: Math.max(0, Math.min(20, (current[side] ?? 0) + delta)),
      },
    }
    setPreds(next)
    storePreds(next)
    setTouched(prev => new Set([...prev, String(id)]))
  }

  function clear(id) {
    const next = { ...preds }
    delete next[id]
    setPreds(next)
    storePreds(next)
    setTouched(prev => { const s = new Set(prev); s.delete(String(id)); return s })
  }

  return (
    <div className={styles.panelBox}>
      <div className={styles.panelBoxHeader}>
        <h2 className={styles.interactiveTitle}>⚡ Match Predictor</h2>
        <span className={styles.panelBoxSub}>Tap +/− to predict the score</span>
      </div>
      {upcoming.length === 0 ? (
        <p className={styles.interactiveEmpty}>No upcoming matches to predict right now.</p>
      ) : (
        <div className={styles.predList}>
          {upcoming.map(m => {
            const pred = preds[m.id]
            const isPredicted = touched.has(String(m.id))
            const homeScore = pred?.home ?? 0
            const awayScore = pred?.away ?? 0
            const homeFlag = getFlagCode(m.homeTeam)
            const awayFlag = getFlagCode(m.awayTeam)
            return (
              <div key={m.id} className={`${styles.predRow}${isPredicted ? ` ${styles.predRowSaved}` : ''}`}>
                <div className={styles.predTeamNames}>
                  <span className={styles.predTeam}>
                    {homeFlag && <img src={flagUrl(homeFlag, 20)} srcSet={`${flagUrl(homeFlag, 40)} 2x`} alt="" className={styles.predFlag} />}
                    {m.homeTeam?.shortName ?? m.homeTeam?.name}
                  </span>
                  <span className={`${styles.predTeam} ${styles.predTeamR}`}>
                    {m.awayTeam?.shortName ?? m.awayTeam?.name}
                    {awayFlag && <img src={flagUrl(awayFlag, 20)} srcSet={`${flagUrl(awayFlag, 40)} 2x`} alt="" className={styles.predFlag} />}
                  </span>
                </div>
                <div className={styles.predControls}>
                  <div className={styles.predStepper}>
                    <button className={styles.predStep} onClick={() => step(m.id, 'home', -1)} aria-label="Decrease home score">−</button>
                    <span className={styles.predScore}>{homeScore}</span>
                    <button className={styles.predStep} onClick={() => step(m.id, 'home', 1)} aria-label="Increase home score">+</button>
                  </div>
                  <span className={styles.predVs}>:</span>
                  <div className={styles.predStepper}>
                    <button className={styles.predStep} onClick={() => step(m.id, 'away', -1)} aria-label="Decrease away score">−</button>
                    <span className={styles.predScore}>{awayScore}</span>
                    <button className={styles.predStep} onClick={() => step(m.id, 'away', 1)} aria-label="Increase away score">+</button>
                  </div>
                </div>
                {isPredicted ? (
                  <div className={styles.predStatus}>
                    <span className={styles.predSavedLabel}>✓ Prediction saved</span>
                    <button className={styles.predClear} onClick={() => clear(m.id)}>Clear</button>
                  </div>
                ) : (
                  <p className={styles.predHint}>Tap + or − to lock in your score</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TRIVIA QUIZ ───────────────────────────────────────────────────────

const QUESTIONS = [
  { q: 'How many teams are competing in FIFA World Cup 2026?',
    opts: ['32', '40', '48', '36'], ans: 2 },
  { q: 'Which three countries are co-hosting WC2026?',
    opts: ['USA, Brazil, Mexico', 'USA, Canada, Mexico', 'USA, Canada, Colombia', 'Canada, Mexico, Argentina'], ans: 1 },
  { q: 'Who are the reigning World Cup champions entering WC2026?',
    opts: ['France', 'Brazil', 'Argentina', 'Germany'], ans: 2 },
  { q: 'Who scored the most goals ever in a single World Cup tournament?',
    opts: ['Ronaldo (Brazil)', 'Miroslav Klose', 'Pelé', 'Just Fontaine'], ans: 3 },
  { q: 'How many groups are in WC2026?',
    opts: ['8', '12', '10', '16'], ans: 1 },
  { q: 'Which team leads WC2026 with 9 goals in the group stage?',
    opts: ['Spain', 'Argentina', 'Germany', 'Brazil'], ans: 2 },
  { q: 'In what year did the World Cup first expand to 32 teams?',
    opts: ['1990', '1994', '1998', '2002'], ans: 2 },
  { q: 'Who won the Golden Boot at FIFA World Cup 2022?',
    opts: ['Lionel Messi', 'Kylian Mbappé', 'Olivier Giroud', 'Antoine Griezmann'], ans: 1 },
  { q: 'How many World Cup goals did Miroslav Klose score in total (all-time record)?',
    opts: ['12', '14', '16', '18'], ans: 2 },
  { q: 'In which year was the very first FIFA World Cup held?',
    opts: ['1928', '1930', '1932', '1926'], ans: 1 },
]

function TriviaQuiz() {
  const [current, setCurrent]   = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore]       = useState(0)
  const [done, setDone]         = useState(false)

  function choose(idx) {
    if (selected !== null) return
    setSelected(idx)
    if (idx === QUESTIONS[current].ans) setScore(s => s + 1)
  }

  function next() {
    if (current + 1 >= QUESTIONS.length) { setDone(true); return }
    setCurrent(c => c + 1)
    setSelected(null)
  }

  function restart() {
    setCurrent(0); setSelected(null); setScore(0); setDone(false)
  }

  const q = QUESTIONS[current]

  return (
    <div className={styles.panelBox}>
      <div className={styles.panelBoxHeader}>
        <h2 className={styles.interactiveTitle}>🧠 WC Trivia Quiz</h2>
        {!done && <span className={styles.panelBoxSub}>{current + 1} / {QUESTIONS.length} · Score: {score}</span>}
      </div>

      {done ? (
        <div className={styles.quizDone}>
          <span className={styles.quizScoreNum}>{score}<span className={styles.quizScoreOf}>/{QUESTIONS.length}</span></span>
          <p className={styles.quizVerdict}>
            {score >= 9 ? '🏆 Football genius!' : score >= 6 ? '⚽ Solid effort!' : score >= 4 ? '📚 Room to improve!' : '😅 Back to basics!'}
          </p>
          <button className={styles.quizRetry} onClick={restart}>Try Again</button>
        </div>
      ) : (
        <>
          <div className={styles.quizProgressBar}>
            <div className={styles.quizProgressFill} style={{ width: `${(current / QUESTIONS.length) * 100}%` }} />
          </div>
          <p className={styles.quizQ}>{q.q}</p>
          <div className={styles.quizOpts}>
            {q.opts.map((opt, i) => {
              let cls = styles.quizOpt
              if (selected !== null) {
                if (i === q.ans) cls = `${styles.quizOpt} ${styles.quizOptCorrect}`
                else if (i === selected) cls = `${styles.quizOpt} ${styles.quizOptWrong}`
              }
              return (
                <button key={i} className={cls} onClick={() => choose(i)} disabled={selected !== null}>
                  <span className={styles.quizOptLetter}>{['A', 'B', 'C', 'D'][i]}</span>
                  {opt}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <button className={styles.quizNext} onClick={next}>
              {current + 1 < QUESTIONS.length ? 'Next →' : 'See Results'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────

export default function Stats() {
  const { data: matchData } = useFetch(getMatches, { matches: fallbackData.matches, espnFailed: false })
  const matches = matchData?.matches ?? []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Statistics</h1>
        <p className={styles.pageSubtitle}>FIFA World Cup 2026: Group Stage</p>
      </div>

      <div className={styles.splitLayout}>
        {/* Left — stats */}
        <div className={styles.statsCol}>
          <section className={styles.col}>
            <h2 className={styles.colTitle}>Tournament</h2>
            <TournamentSection tournament={statsData.tournament} />
          </section>
          <section className={styles.col}>
            <h2 className={styles.colTitle}>Teams</h2>
            <TeamSection teams={statsData.teamStats} />
          </section>
          <section className={styles.col}>
            <h2 className={styles.colTitle}>Players</h2>
            <PlayerSection players={statsData.playerStats} />
          </section>
        </div>

        {/* Right — interactive */}
        <div className={styles.interactiveCol}>
          <MatchPredictor matches={matches} />
          <TriviaQuiz />
        </div>
      </div>
    </div>
  )
}
