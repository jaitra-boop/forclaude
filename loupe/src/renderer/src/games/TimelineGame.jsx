import React, { useState } from 'react'
import { TIMELINE_DATA } from '../data/games'
import {
  BORDER_SUBTLE,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  SUCCESS, ERROR,
  RADIUS_MD, RADIUS_SM, RADIUS_PILL, FONT_BASE
} from '../theme'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TimelineGame({ onComplete }) {
  const [items, setItems] = useState(() => shuffle(TIMELINE_DATA.milestones))
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  function move(idx, dir) {
    if (submitted) return
    const t = idx + dir
    if (t < 0 || t >= items.length) return
    const n = [...items];
    [n[idx], n[t]] = [n[t], n[idx]]
    setItems(n)
  }

  function submit() {
    let correct = 0
    items.forEach((item, i) => { if (item.order === i + 1) correct++ })
    setScore(correct)
    setSubmitted(true)
    setTimeout(onComplete, 1500)
  }

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <span style={styles.title}>The Timeline</span>
        {!submitted
          ? <span style={styles.hint}>Use arrows to reorder</span>
          : <span style={styles.scoreLabel}>{score}/{items.length} correct</span>
        }
      </div>

      <div style={styles.list}>
        {items.map((item, idx) => {
          const ok  = submitted && item.order === idx + 1
          const bad = submitted && item.order !== idx + 1
          return (
            <div
              key={item.year}
              style={{
                ...styles.item,
                border: `1px solid ${ok ? 'rgba(0,212,161,0.4)' : bad ? 'rgba(255,77,106,0.4)' : BORDER_SUBTLE}`,
                background: ok ? 'rgba(0,212,161,0.08)' : bad ? 'rgba(255,77,106,0.08)' : 'rgba(255,255,255,0.04)'
              }}
            >
              <div style={styles.itemLeft}>
                <span style={{
                  ...styles.year,
                  color: ok ? '#00D4A1' : bad ? '#FF4D6A' : TEXT_ACCENT
                }}>{item.year}</span>
                <span style={styles.event}>{item.event}</span>
              </div>
              {!submitted ? (
                <div style={styles.arrows}>
                  <button style={styles.arr} onClick={() => move(idx, -1)} disabled={idx === 0}>▲</button>
                  <button style={styles.arr} onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>▼</button>
                </div>
              ) : (
                <span style={{ fontSize: '16px', marginLeft: '8px' }}>
                  {ok ? '✓' : '✗'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!submitted && (
        <button style={styles.submitBtn} onClick={submit}>
          Submit order
        </button>
      )}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT_BASE },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  hint: { fontSize: '11px', color: TEXT_MUTED },
  scoreLabel: { fontSize: '13px', fontWeight: '700', color: '#00D4A1' },

  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  item: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px', borderRadius: RADIUS_MD, transition: 'all 0.2s'
  },
  itemLeft: { display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 },
  year: { fontSize: '12px', fontWeight: '800', minWidth: '36px', fontVariantNumeric: 'tabular-nums' },
  event: { fontSize: '12px', color: TEXT_SECONDARY, lineHeight: '1.4' },

  arrows: { display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px' },
  arr: {
    background: 'rgba(255,255,255,0.07)', border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: '5px', width: '24px', height: '20px',
    fontSize: '10px', cursor: 'pointer', color: TEXT_SECONDARY,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s'
  },

  submitBtn: {
    background: 'linear-gradient(135deg,#7B2FF7,#2196F3)',
    border: 'none', borderRadius: RADIUS_MD,
    padding: '12px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(123,47,247,0.35)'
  }
}
