import React, { useState } from 'react'
import { WORDS } from '../data/words'
import { LESSONS } from '../data/lessons'
import { GAMES } from '../data/games'
import { WANDER } from '../data/wander'
import {
  BG_BASE, BG_SURFACE, BG_ELEVATED, BORDER_SUBTLE,
  GRAD_PRIMARY,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  SUCCESS, AMBER,
  RADIUS_MD, RADIUS_SM, RADIUS_PILL, FONT_BASE, FONT_MONO
} from '../theme'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function getDayContent(dateStr) {
  const epoch = Math.floor(new Date(dateStr).getTime() / 86400000)
  return {
    word:   WORDS[epoch % WORDS.length].word,
    lesson: LESSONS[epoch % LESSONS.length].title,
    game:   GAMES[epoch % GAMES.length].title,
    wander: WANDER[epoch % WANDER.length].title
  }
}

function dateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export default function CalendarView({ appData }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(null)

  const today = now.toISOString().slice(0, 10)

  function prev() { month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1) }
  function next() { month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1) }

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysCount = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({length:daysCount},(_,i)=>i+1)]

  function dotColor(ds) {
    const c = appData?.completions?.[ds]
    if (!c) return null
    return (c.drops||0) >= 4 ? '#00D4A1' : (c.drops||0) > 0 ? AMBER : null
  }

  const sel = selected
  const selContent = sel ? getDayContent(sel) : null
  const selComp = sel ? appData?.completions?.[sel] : null
  const isPast = sel && sel < today
  const isToday = sel === today
  const isFuture = sel && sel > today

  return (
    <div style={styles.view}>
      {/* Month nav */}
      <div style={styles.nav}>
        <button style={styles.navBtn} onClick={prev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={styles.monthLabel}>{MONTHS[month]} {year}</span>
        <button style={styles.navBtn} onClick={next}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div style={styles.dayHeaders}>
        {DAYS_SHORT.map(d => <div key={d} style={styles.dayHeader}>{d}</div>)}
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />
          const ds = dateStr(year, month, d)
          const dot = dotColor(ds)
          const isT = ds === today
          const isSel = sel === ds
          return (
            <button
              key={d}
              style={{
                ...styles.cell,
                background: isSel
                  ? 'linear-gradient(135deg,rgba(123,47,247,0.35),rgba(33,150,243,0.35))'
                  : isT ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: isSel
                  ? '1px solid rgba(123,47,247,0.5)'
                  : isT ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                boxShadow: isSel ? '0 0 12px rgba(123,47,247,0.25)' : 'none'
              }}
              onClick={() => setSelected(isSel ? null : ds)}
            >
              <span style={{ ...styles.dayNum, color: isSel ? '#fff' : isT ? TEXT_PRIMARY : TEXT_MUTED }}>
                {d}
              </span>
              {dot && <div style={{ ...styles.dot, background: dot, boxShadow: `0 0 5px ${dot}` }} />}
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      {sel && (
        <div style={styles.detail}>
          <div style={styles.detailHeader}>
            <span style={styles.detailDate}>{sel}</span>
            {selComp && <span style={styles.detailDrops}>{selComp.drops || 0} drops</span>}
          </div>

          {(isPast || isToday) && selComp && (
            <div style={styles.logCard}>
              {[
                ['Word',   selComp.word   ? selContent.word   : '—'],
                ['Lesson', selComp.lesson ? selContent.lesson : '—'],
                ['Spark',  selComp.spark  ? selContent.game   : '—'],
                ['Wander', selComp.wander ? selContent.wander : '—']
              ].map(([k,v]) => (
                <div key={k} style={styles.logRow}>
                  <span style={styles.logKey}>{k}</span>
                  <span style={styles.logVal}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {(isPast || isToday) && !selComp && (
            <div style={styles.empty}>No activity logged for this day.</div>
          )}

          {isFuture && selContent && (
            <div style={styles.previewCard}>
              <div style={styles.previewBadge}>Coming up</div>
              {[
                ['Word',   selContent.word],
                ['Lesson', selContent.lesson],
                ['Spark',  selContent.game]
              ].map(([k,v]) => (
                <div key={k} style={styles.logRow}>
                  <span style={styles.logKey}>{k}</span>
                  <span style={styles.logVal}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  view: {
    flex: 1, overflowY: 'auto', background: BG_BASE,
    padding: '14px 16px 20px', fontFamily: FONT_BASE
  },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  navBtn: {
    width: '32px', height: '32px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER_SUBTLE}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  },
  monthLabel: { fontSize: '14px', fontWeight: '700', color: TEXT_PRIMARY },

  dayHeaders: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '4px' },
  dayHeader: { textAlign: 'center', fontSize: '10px', color: TEXT_MUTED, fontWeight: '600', padding: '4px 0', letterSpacing: '0.3px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px', marginBottom: '16px' },
  cell: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '6px 2px', borderRadius: RADIUS_SM, cursor: 'pointer', gap: '3px', transition: 'all 0.15s'
  },
  dayNum: { fontSize: '12px', fontWeight: '500', lineHeight: 1 },
  dot: { width: '5px', height: '5px', borderRadius: '50%' },

  detail: { display: 'flex', flexDirection: 'column', gap: '8px' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  detailDate: { fontSize: '11px', fontWeight: '700', color: TEXT_MUTED, fontFamily: FONT_MONO, letterSpacing: '0.3px' },
  detailDrops: { fontSize: '12px', color: AMBER, fontWeight: '700' },

  logCard: {
    background: BG_SURFACE, border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_MD, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: '8px'
  },
  previewCard: {
    background: 'rgba(123,47,247,0.08)', border: '1px solid rgba(123,47,247,0.2)',
    borderRadius: RADIUS_MD, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: '8px'
  },
  previewBadge: {
    fontSize: '10px', fontWeight: '700', color: TEXT_ACCENT,
    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px'
  },
  logRow: { display: 'flex', gap: '12px', alignItems: 'baseline' },
  logKey: { fontSize: '10px', color: TEXT_MUTED, minWidth: '44px', fontFamily: FONT_MONO, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' },
  logVal: { fontSize: '12px', color: TEXT_SECONDARY, fontFamily: FONT_MONO, flex: 1 },
  empty: { fontSize: '13px', color: TEXT_MUTED, fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }
}
