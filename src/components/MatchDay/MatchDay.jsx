import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './MatchDay.module.css'

const YESTERDAY = [
  // Group A – Jun 14
  { id: 'y1', group: 'Group A', home: { name: 'Mexico',      code: 'mx'     }, away: { name: 'South Africa', code: 'za'     }, homeScore: 2, awayScore: 0 },
  { id: 'y2', group: 'Group A', home: { name: 'South Korea', code: 'kr'     }, away: { name: 'Czechia',      code: 'cz'     }, homeScore: 2, awayScore: 1 },
  // Group B – Jun 14
  { id: 'y3', group: 'Group B', home: { name: 'Canada',      code: 'ca'     }, away: { name: 'Bosnia',       code: 'ba'     }, homeScore: 1, awayScore: 1 },
  { id: 'y4', group: 'Group B', home: { name: 'Qatar',       code: 'qa'     }, away: { name: 'Switzerland',  code: 'ch'     }, homeScore: 1, awayScore: 1 },
  // Group C – Jun 14
  { id: 'y5', group: 'Group C', home: { name: 'Scotland',    code: 'gb-sct' }, away: { name: 'Haiti',        code: 'ht'     }, homeScore: 1, awayScore: 0 },
  { id: 'y6', group: 'Group C', home: { name: 'Morocco',     code: 'ma'     }, away: { name: 'Brazil',       code: 'br'     }, homeScore: 1, awayScore: 1 },
  // Group D – Jun 14
  { id: 'y7', group: 'Group D', home: { name: 'USA',         code: 'us'     }, away: { name: 'Paraguay',     code: 'py'     }, homeScore: 4, awayScore: 1 },
  { id: 'y8', group: 'Group D', home: { name: 'Australia',   code: 'au'     }, away: { name: 'Türkiye',      code: 'tr'     }, homeScore: 2, awayScore: 0 },
  // Group E – Jun 14
  { id: 'y9',  group: 'Group E', home: { name: 'Germany',    code: 'de'     }, away: { name: 'Curaçao',      code: 'cw'     }, homeScore: 7, awayScore: 1 },
  { id: 'y10', group: 'Group E', home: { name: 'Ivory Coast',code: 'ci'     }, away: { name: 'Ecuador',      code: 'ec'     }, homeScore: 1, awayScore: 0 },
  // Group F – Jun 14/15
  { id: 'y11', group: 'Group F', home: { name: 'Netherlands',code: 'nl'     }, away: { name: 'Japan',        code: 'jp'     }, homeScore: 2, awayScore: 2 },
  { id: 'y12', group: 'Group F', home: { name: 'Sweden',     code: 'se'     }, away: { name: 'Tunisia',      code: 'tn'     }, homeScore: 5, awayScore: 1 },
]

const TODAY = [
  // Group G – Jun 15
  { id: 't1', group: 'Group G', home: { name: 'Belgium',      code: 'be'     }, away: { name: 'New Zealand',  code: 'nz'     }, time: '16:00' },
  { id: 't2', group: 'Group G', home: { name: 'Iran',         code: 'ir'     }, away: { name: 'Egypt',        code: 'eg'     }, time: '19:00' },
  // Group H – Jun 15
  { id: 't3', group: 'Group H', home: { name: 'Spain',        code: 'es'     }, away: { name: 'Cape Verde',   code: 'cv'     }, time: '16:00' },
  { id: 't4', group: 'Group H', home: { name: 'Uruguay',      code: 'uy'     }, away: { name: 'Saudi Arabia', code: 'sa'     }, time: '19:00' },
  // Group I – Jun 15
  { id: 't5', group: 'Group I', home: { name: 'France',       code: 'fr'     }, away: { name: 'Iraq',         code: 'iq'     }, time: '22:00' },
  { id: 't6', group: 'Group I', home: { name: 'Senegal',      code: 'sn'     }, away: { name: 'Norway',       code: 'no'     }, time: '22:00' },
]

const TOP_SCORERS = [
  { rank: 1, name: 'Folarin Balogun',  country: 'United States', code: 'us', goals: 2, assists: 0 },
  { rank: 2, name: 'Kai Havertz',      country: 'Germany',       code: 'de', goals: 2, assists: 1 },
  { rank: 3, name: 'Jamal Musiala',    country: 'Germany',       code: 'de', goals: 1, assists: 2 },
  { rank: 4, name: 'Giovanni Reyna',   country: 'United States', code: 'us', goals: 1, assists: 1 },
  { rank: 5, name: 'Nestory Irankunda',country: 'Australia',     code: 'au', goals: 1, assists: 1 },
]

const ALL_GROUPS = [
  'All Groups',
  'Group A', 'Group B', 'Group C', 'Group D',
  'Group E', 'Group F', 'Group G', 'Group H',
  'Group I', 'Group J', 'Group K', 'Group L',
]

function Flag({ code, name, size = 'md' }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={name}
      className={`${styles.flagImg} ${size === 'lg' ? styles.flagImgLg : ''}`}
    />
  )
}

function FilterBar({ active, onChange }) {
  return (
    <div className={styles.filterBar} role="toolbar" aria-label="Filter by group">
      {ALL_GROUPS.map(g => (
        <button
          key={g}
          className={`${styles.filterChip} ${active === g ? styles.filterChipActive : ''}`}
          onClick={() => onChange(g)}
          aria-pressed={active === g}
        >
          {g}
        </button>
      ))}
    </div>
  )
}

function ResultRow({ match, onClick }) {
  const { home, away, homeScore, awayScore } = match
  const homeWin = homeScore > awayScore
  const awayWin = awayScore > homeScore
  const draw = homeScore === awayScore

  return (
    <button
      className={styles.row}
      onClick={onClick}
      aria-label={`${home.name} ${homeScore}–${awayScore} ${away.name}, full time`}
    >
      <span className={styles.teamFlag}>
        <Flag code={home.code} name={home.name} />
      </span>
      <div className={styles.teams}>
        <span className={`${styles.team} ${homeWin ? styles.teamWin : draw ? styles.teamDraw : styles.teamLoss}`}>
          {home.name}
        </span>
        <div className={styles.scoreWrap}>
          <span className={`${styles.scoreDigit} ${homeWin ? styles.winNum : draw ? styles.drawNum : ''}`}>
            {homeScore}
          </span>
          <span className={styles.scoreDivider}>:</span>
          <span className={`${styles.scoreDigit} ${awayWin ? styles.winNum : draw ? styles.drawNum : ''}`}>
            {awayScore}
          </span>
        </div>
        <span className={`${styles.team} ${styles.teamRight} ${awayWin ? styles.teamWin : draw ? styles.teamDraw : styles.teamLoss}`}>
          {away.name}
        </span>
      </div>
      <span className={styles.teamFlag}>
        <Flag code={away.code} name={away.name} />
      </span>
      <span className={styles.ftTag}>FT</span>
    </button>
  )
}

function FixtureRow({ match, onClick }) {
  const { home, away, time } = match
  return (
    <button
      className={styles.row}
      onClick={onClick}
      aria-label={`${home.name} vs ${away.name}, kick off ${time}`}
    >
      <span className={styles.teamFlag}>
        <Flag code={home.code} name={home.name} />
      </span>
      <div className={styles.teams}>
        <span className={styles.team}>{home.name}</span>
        <div className={`${styles.scoreWrap} ${styles.timeWrap}`}>
          <span className={styles.timeText}>{time}</span>
        </div>
        <span className={`${styles.team} ${styles.teamRight}`}>{away.name}</span>
      </div>
      <span className={styles.teamFlag}>
        <Flag code={away.code} name={away.name} />
      </span>
      <span className={styles.koTag}>KO</span>
    </button>
  )
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>No matches on this day for this group.</div>
  )
}

function GoldenBoot() {
  return (
    <div className={styles.goldenBoot}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span className={styles.bootIcon} aria-hidden="true">🥾</span>
          Golden Boot Race
        </h2>
        <span className={styles.dateChip}>Top 5 Scorers</span>
      </div>
      <div className={styles.scorerList}>
        {TOP_SCORERS.map(({ rank, name, country, code, goals, assists }) => (
          <div key={rank} className={styles.scorerRow}>
            <span
              className={`${styles.rank} ${
                rank === 1 ? styles.rankGold :
                rank === 2 ? styles.rankSilver :
                rank === 3 ? styles.rankBronze : ''
              }`}
            >
              {rank}
            </span>
            <span className={styles.scorerFlag}>
              <Flag code={code} name={country} size="lg" />
            </span>
            <div className={styles.scorerInfo}>
              <span className={styles.scorerName}>{name}</span>
              <span className={styles.scorerCountry}>{country}</span>
            </div>
            <div className={styles.scorerStats}>
              <span className={styles.goals}>{goals}</span>
              <span className={styles.goalLabel}>G</span>
              <span className={styles.statDivider} aria-hidden="true" />
              <span className={styles.assists}>{assists}</span>
              <span className={styles.assistLabel}>A</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MatchDay() {
  const [activeGroup, setActiveGroup] = useState('All Groups')
  const navigate = useNavigate()

  const filteredYesterday = activeGroup === 'All Groups'
    ? YESTERDAY
    : YESTERDAY.filter(m => m.group === activeGroup)

  const filteredToday = activeGroup === 'All Groups'
    ? TODAY
    : TODAY.filter(m => m.group === activeGroup)

  return (
    <div className={styles.outer}>
      <FilterBar active={activeGroup} onChange={setActiveGroup} />

      <div className={styles.wrapper}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Yesterday's Results</h2>
            <span className={styles.dateChip}>14 Jun 2026</span>
          </div>
          <div className={styles.list}>
            {filteredYesterday.length > 0
              ? filteredYesterday.map(m => (
                  <ResultRow key={m.id} match={m} onClick={() => navigate('/matches')} />
                ))
              : <EmptyState />
            }
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Today's Fixtures</h2>
            <span className={styles.dateChip}>15 Jun 2026</span>
          </div>
          <div className={styles.list}>
            {filteredToday.length > 0
              ? filteredToday.map(m => (
                  <FixtureRow key={m.id} match={m} onClick={() => navigate('/matches')} />
                ))
              : <EmptyState />
            }
          </div>
        </div>
      </div>

      <GoldenBoot />
    </div>
  )
}
