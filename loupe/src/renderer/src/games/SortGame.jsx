import React, { useState } from 'react'
import { SORT_DATA } from '../data/games'
import {
  BG_ELEVATED, BORDER_SUBTLE, BORDER_DEFAULT,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  SUCCESS, ERROR,
  RADIUS_MD, RADIUS_SM, RADIUS_PILL, FONT_BASE
} from '../theme'

const CAT_GRADS = [
  'linear-gradient(135deg,#7B2FF7,#2196F3)',
  'linear-gradient(135deg,#F72585,#7B2FF7)',
  'linear-gradient(135deg,#00C6FF,#0072FF)'
]
const CAT_GLOWS = ['rgba(123,47,247,0.35)', 'rgba(247,37,133,0.35)', 'rgba(0,198,255,0.35)']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SortGame({ onComplete }) {
  const [items] = useState(() => shuffle(SORT_DATA.items))
  const [selected, setSelected] = useState(null)
  const [placements, setPlacements] = useState({})
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)

  function selectTerm(term) {
    if (placements[term]) return
    setSelected(s => s === term ? null : term)
  }

  function placeTerm(category) {
    if (!selected) return
    const correct = SORT_DATA.items.find(i => i.term === selected)?.category === category
    if (correct) {
      const newPlacements = { ...placements, [selected]: category }
      setPlacements(newPlacements)
      setSelected(null)
      if (Object.keys(newPlacements).length === SORT_DATA.items.length) {
        setDone(true)
        setTimeout(onComplete, 800)
      }
    } else {
      setErrors(e => ({ ...e, [selected]: true }))
      setTimeout(() => setErrors(e => { const n = { ...e }; delete n[selected]; return n }), 600)
    }
  }

  const unplaced = items.filter(i => !placements[i.term])

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <span style={styles.title}>The Sort</span>
        <span style={styles.progress}>{Object.keys(placements).length}/{SORT_DATA.items.length}</span>
      </div>
      <p style={styles.instructions}>Tap a term, then tap its category bucket.</p>

      <div style={styles.terms}>
        {unplaced.map(({ term }) => {
          const isSel = selected === term
          const isErr = errors[term]
          return (
            <button
              key={term}
              style={{
                ...styles.term,
                background: isErr ? 'rgba(255,77,106,0.2)' : isSel ? 'rgba(123,47,247,0.3)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isErr ? 'rgba(255,77,106,0.5)' : isSel ? 'rgba(123,47,247,0.6)' : BORDER_SUBTLE}`,
                color: isSel ? '#fff' : TEXT_SECONDARY,
                boxShadow: isSel ? '0 0 12px rgba(123,47,247,0.3)' : 'none'
              }}
              onClick={() => selectTerm(term)}
            >
              {term}
            </button>
          )
        })}
      </div>

      <div style={styles.categories}>
        {SORT_DATA.categories.map((cat, idx) => {
          const placed = items.filter(i => placements[i.term] === cat)
          return (
            <div
              key={cat}
              style={{
                ...styles.bucket,
                borderColor: selected ? 'rgba(255,255,255,0.2)' : BORDER_SUBTLE,
                background: selected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
              }}
              onClick={() => placeTerm(cat)}
            >
              <div style={{ ...styles.catLabel, background: CAT_GRADS[idx], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {cat}
              </div>
              <div style={styles.placed}>
                {placed.map(i => (
                  <span key={i.term} style={{ ...styles.placedChip, background: CAT_GRADS[idx], boxShadow: `0 2px 8px ${CAT_GLOWS[idx]}` }}>
                    {i.term}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {done && <div style={styles.doneMsg}>All sorted ✓</div>}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: FONT_BASE },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  progress: { fontSize: '12px', color: TEXT_MUTED },
  instructions: { fontSize: '12px', color: TEXT_MUTED, margin: 0 },
  terms: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  term: {
    padding: '6px 11px', borderRadius: RADIUS_PILL, cursor: 'pointer',
    fontSize: '12px', fontWeight: '500', transition: 'all 0.15s'
  },
  categories: { display: 'flex', flexDirection: 'column', gap: '8px' },
  bucket: {
    border: '1px solid', borderRadius: RADIUS_MD, padding: '10px 12px',
    cursor: 'pointer', minHeight: '48px', transition: 'all 0.15s'
  },
  catLabel: { fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' },
  placed: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  placedChip: { padding: '3px 9px', borderRadius: RADIUS_PILL, fontSize: '11px', fontWeight: '600', color: '#fff' },
  doneMsg: { textAlign: 'center', color: '#00D4A1', fontWeight: '700', fontSize: '14px' }
}
