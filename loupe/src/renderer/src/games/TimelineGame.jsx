import React, { useState } from 'react'
import { TIMELINE_DATA } from '../data/games'

const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const ACCENT = '#7BB8A0'
const ERROR = '#D4544A'

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
    const newItems = [...items]
    const target = idx + dir
    if (target < 0 || target >= newItems.length) return
    ;[newItems[idx], newItems[target]] = [newItems[target], newItems[idx]]
    setItems(newItems)
  }

  function submitOrder() {
    let correct = 0
    items.forEach((item, i) => {
      if (item.order === i + 1) correct++
    })
    setScore(correct)
    setSubmitted(true)
    setTimeout(onComplete, 1500)
  }

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <div style={styles.title}>The Timeline</div>
        {!submitted && <div style={styles.hint}>Use arrows to reorder</div>}
        {submitted && <div style={styles.scoreLabel}>{score}/{items.length} correct</div>}
      </div>

      <div style={styles.list}>
        {items.map((item, idx) => {
          const isCorrect = submitted && item.order === idx + 1
          const isWrong = submitted && item.order !== idx + 1
          return (
            <div
              key={item.year}
              style={{
                ...styles.item,
                borderColor: isCorrect ? ACCENT : (isWrong ? ERROR : BORDER),
                background: isCorrect ? '#F5F9F7' : (isWrong ? '#FDF5F5' : '#FFFFFF')
              }}
            >
              <div style={styles.itemContent}>
                <span style={styles.year}>{item.year}</span>
                <span style={styles.event}>{item.event}</span>
              </div>
              {!submitted && (
                <div style={styles.arrows}>
                  <button style={styles.arrow} onClick={() => move(idx, -1)} disabled={idx === 0}>▲</button>
                  <button style={styles.arrow} onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>▼</button>
                </div>
              )}
              {submitted && (
                <span style={{ fontSize: '16px', marginLeft: '8px' }}>
                  {isCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!submitted && (
        <button style={styles.submitBtn} onClick={submitOrder}>
          Submit order
        </button>
      )}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  hint: { fontSize: '11px', color: TEXT_MUTED },
  scoreLabel: { fontSize: '13px', fontWeight: '700', color: ACCENT },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    border: '1.5px solid',
    borderRadius: '10px',
    transition: 'all 0.2s'
  },
  itemContent: { display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 },
  year: { fontSize: '13px', fontWeight: '700', color: ACCENT, minWidth: '38px' },
  event: { fontSize: '12px', color: TEXT_PRIMARY, lineHeight: '1.4' },
  arrows: { display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px' },
  arrow: {
    background: '#F0EBE3',
    border: 'none',
    borderRadius: '4px',
    width: '22px',
    height: '18px',
    fontSize: '10px',
    cursor: 'pointer',
    color: TEXT_PRIMARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtn: {
    background: TEXT_PRIMARY,
    color: '#FAF7F2',
    border: 'none',
    borderRadius: '8px',
    padding: '11px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  }
}
