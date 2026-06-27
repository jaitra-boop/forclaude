import React, { useState } from 'react'
import { SORT_DATA } from '../data/games'

const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const ACCENT = '#7BB8A0'
const SELECTED_BG = '#3D3530'
const SELECTED_TEXT = '#FAF7F2'
const CAT_COLORS = ['#7BB8A0', '#C48A5C', '#7B9EC4']
const ERROR_COLOR = '#D4544A'

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
    setSelected(selected === term ? null : term)
  }

  function placeTerm(category) {
    if (!selected) return
    const correct = SORT_DATA.items.find(i => i.term === selected)?.category === category
    if (correct) {
      setPlacements(p => ({ ...p, [selected]: category }))
      setErrors(e => { const n = { ...e }; delete n[selected]; return n })
      setSelected(null)
      const newPlacements = { ...placements, [selected]: category }
      if (Object.keys(newPlacements).length === SORT_DATA.items.length) {
        setDone(true)
        setTimeout(onComplete, 800)
      }
    } else {
      setErrors(e => ({ ...e, [selected]: true }))
      setTimeout(() => {
        setErrors(e => { const n = { ...e }; delete n[selected]; return n })
      }, 600)
    }
  }

  const unplaced = items.filter(i => !placements[i.term])
  const score = Object.keys(placements).length

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <div style={styles.title}>The Sort</div>
        <div style={styles.score}>{score}/{SORT_DATA.items.length} sorted</div>
      </div>
      <div style={styles.instructions}>Tap a term, then tap its category.</div>

      <div style={styles.terms}>
        {unplaced.map(({ term }) => (
          <button
            key={term}
            style={{
              ...styles.term,
              background: selected === term ? SELECTED_BG : (errors[term] ? ERROR_COLOR : '#F0EBE3'),
              color: selected === term ? SELECTED_TEXT : (errors[term] ? SELECTED_TEXT : TEXT_PRIMARY)
            }}
            onClick={() => selectTerm(term)}
          >
            {term}
          </button>
        ))}
      </div>

      <div style={styles.categories}>
        {SORT_DATA.categories.map((cat, idx) => {
          const placed = items.filter(i => placements[i.term] === cat)
          return (
            <div
              key={cat}
              style={{ ...styles.catBucket, borderColor: CAT_COLORS[idx] }}
              onClick={() => placeTerm(cat)}
            >
              <div style={{ ...styles.catLabel, color: CAT_COLORS[idx] }}>{cat}</div>
              <div style={styles.placed}>
                {placed.map(i => (
                  <span key={i.term} style={{ ...styles.placedTerm, background: CAT_COLORS[idx] + '22', color: CAT_COLORS[idx] }}>
                    {i.term}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {done && <div style={styles.doneMsg}>All sorted! ✓</div>}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  score: { fontSize: '12px', color: TEXT_MUTED },
  instructions: { fontSize: '12px', color: TEXT_MUTED },
  terms: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  term: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  categories: { display: 'flex', flexDirection: 'column', gap: '8px' },
  catBucket: {
    border: '2px solid',
    borderRadius: '10px',
    padding: '10px',
    cursor: 'pointer',
    minHeight: '44px'
  },
  catLabel: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '6px' },
  placed: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  placedTerm: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' },
  doneMsg: { textAlign: 'center', color: ACCENT, fontWeight: '700', fontSize: '14px' }
}
