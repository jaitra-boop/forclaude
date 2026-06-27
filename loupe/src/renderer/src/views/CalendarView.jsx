import React, { useState } from 'react'
import { WORDS } from '../data/words'
import { LESSONS } from '../data/lessons'
import { GAMES } from '../data/games'
import { WANDER } from '../data/wander'

const BG = '#FAF7F2'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const SAGE = '#7BB8A0'
const AMBER = '#E8A020'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function getDayContent(dateStr) {
  const epoch = Math.floor(new Date(dateStr).getTime() / 86400000)
  return {
    word: WORDS[epoch % WORDS.length].word,
    lesson: LESSONS[epoch % LESSONS.length].title,
    game: GAMES[epoch % GAMES.length].title,
    wander: WANDER[epoch % WANDER.length].title
  }
}

export default function CalendarView({ appData }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(null)

  const today = now.toISOString().slice(0, 10)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function getDotStyle(dateStr) {
    const comp = appData?.completions?.[dateStr]
    if (!comp) return null
    const drops = comp.drops || 0
    if (drops >= 4) return SAGE
    if (drops > 0) return AMBER
    return null
  }

  const selectedContent = selected ? getDayContent(selected) : null
  const selectedComp = selected ? appData?.completions?.[selected] : null
  const isPast = selected && selected < today
  const isToday = selected === today
  const isFuture = selected && selected > today

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div style={styles.view}>
      <div style={styles.nav}>
        <button style={styles.navBtn} onClick={prevMonth}>←</button>
        <span style={styles.monthLabel}>{monthNames[month]} {year}</span>
        <button style={styles.navBtn} onClick={nextMonth}>→</button>
      </div>

      <div style={styles.dayHeaders}>
        {DAYS.map(d => <div key={d} style={styles.dayHeader}>{d}</div>)}
      </div>

      <div style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />
          const dateStr = getDateStr(year, month, d)
          const dotColor = getDotStyle(dateStr)
          const isT = dateStr === today
          const isSel = selected === dateStr
          return (
            <button
              key={d}
              style={{
                ...styles.cell,
                background: isSel ? TEXT_PRIMARY : (isT ? '#F0EBE3' : 'transparent'),
                color: isSel ? '#FAF7F2' : (isT ? TEXT_PRIMARY : TEXT_MUTED)
              }}
              onClick={() => setSelected(isSel ? null : dateStr)}
            >
              <span style={styles.dayNum}>{d}</span>
              {dotColor && <div style={{ ...styles.dot, background: dotColor }} />}
            </button>
          )
        })}
      </div>

      {selected && (
        <div style={styles.detail}>
          <div style={styles.detailDate}>{selected}</div>

          {(isPast || isToday) && selectedComp && (
            <div style={styles.logCard}>
              <div style={styles.logRow}><span style={styles.logKey}>Word</span><span style={styles.logVal}>{selectedComp.word ? selectedContent.word : '—'}</span></div>
              <div style={styles.logRow}><span style={styles.logKey}>Lesson</span><span style={styles.logVal}>{selectedComp.lesson ? selectedContent.lesson : '—'}</span></div>
              <div style={styles.logRow}><span style={styles.logKey}>Spark</span><span style={styles.logVal}>{selectedComp.spark ? selectedContent.game : '—'}</span></div>
              <div style={styles.logRow}><span style={styles.logKey}>Wander</span><span style={styles.logVal}>{selectedComp.wander ? selectedContent.wander : '—'}</span></div>
              <div style={styles.logRow}><span style={styles.logKey}>Drops</span><span style={{ ...styles.logVal, color: AMBER, fontWeight: '700' }}>{selectedComp.drops || 0}</span></div>
            </div>
          )}

          {(isPast || isToday) && !selectedComp && (
            <div style={styles.emptyDay}>No activity logged for this day.</div>
          )}

          {isFuture && selectedContent && (
            <div style={styles.previewCard}>
              <div style={styles.previewLabel}>Coming up</div>
              <div style={styles.previewRow}><span style={styles.logKey}>Word</span><span style={styles.logVal}>{selectedContent.word}</span></div>
              <div style={styles.previewRow}><span style={styles.logKey}>Lesson</span><span style={styles.logVal}>{selectedContent.lesson}</span></div>
              <div style={styles.previewRow}><span style={styles.logKey}>Spark</span><span style={styles.logVal}>{selectedContent.game}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  view: {
    flex: 1,
    overflowY: 'auto',
    background: BG,
    padding: '16px'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px'
  },
  navBtn: {
    background: '#F0EBE3',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '16px',
    cursor: 'pointer',
    color: TEXT_PRIMARY
  },
  monthLabel: {
    fontSize: '15px',
    fontWeight: '700',
    color: TEXT_PRIMARY
  },
  dayHeaders: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: '4px'
  },
  dayHeader: {
    textAlign: 'center',
    fontSize: '10px',
    color: TEXT_MUTED,
    fontWeight: '600',
    letterSpacing: '0.3px',
    padding: '4px 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px'
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 2px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    gap: '2px',
    transition: 'all 0.15s'
  },
  dayNum: {
    fontSize: '13px',
    fontWeight: '500',
    lineHeight: 1
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%'
  },
  detail: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  detailDate: {
    fontSize: '12px',
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: '0.3px'
  },
  logCard: {
    background: '#FFFFFF',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    padding: '14px',
    fontFamily: 'monospace',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  previewCard: {
    background: '#F5F9F7',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  previewLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: SAGE,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  logRow: { display: 'flex', gap: '10px', alignItems: 'baseline' },
  previewRow: { display: 'flex', gap: '10px', alignItems: 'baseline' },
  logKey: { fontSize: '11px', color: TEXT_MUTED, minWidth: '52px', fontFamily: 'monospace' },
  logVal: { fontSize: '12px', color: TEXT_PRIMARY, fontFamily: 'monospace', flex: 1 },
  emptyDay: { fontSize: '13px', color: TEXT_MUTED, fontStyle: 'italic' }
}
