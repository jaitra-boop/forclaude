import React, { useState } from 'react'
import { TRUEFALSE_DATA } from '../data/games'

const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const ACCENT = '#7BB8A0'
const AMBER = '#E8A020'
const BLUE = '#7B9EC4'
const OPTIONS = ['True', 'False', 'It Depends']

const setIndex = Math.floor(Date.now() / 86400000) % TRUEFALSE_DATA.length
const STATEMENTS = TRUEFALSE_DATA[setIndex].statements

function OptionButton({ label, chosen, correct, revealed, onClick }) {
  let bg = '#F0EBE3'
  let color = TEXT_PRIMARY
  if (revealed && label === correct) { bg = ACCENT; color = '#FFF' }
  else if (revealed && label === chosen && label !== correct) { bg = '#D4544A'; color = '#FFF' }
  else if (!revealed && chosen === label) { bg = TEXT_PRIMARY; color = '#FAF7F2' }

  return (
    <button
      style={{ ...styles.option, background: bg, color }}
      onClick={!revealed ? onClick : undefined}
      disabled={revealed}
    >
      {label}
    </button>
  )
}

export default function TrueFalseGame({ onComplete }) {
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})
  const total = STATEMENTS.length

  function choose(stmtIdx, option) {
    if (revealed[stmtIdx]) return
    setAnswers(a => ({ ...a, [stmtIdx]: option }))
    setRevealed(r => ({ ...r, [stmtIdx]: true }))
    const newRevealed = { ...revealed, [stmtIdx]: true }
    if (Object.keys(newRevealed).length === total) {
      setTimeout(onComplete, 1000)
    }
  }

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <div style={styles.title}>True / False / It Depends</div>
        <div style={styles.progress}>{Object.keys(revealed).length}/{total}</div>
      </div>

      {STATEMENTS.map((stmt, i) => (
        <div key={i} style={styles.stmt}>
          <div style={styles.stmtText}>{stmt.text}</div>
          <div style={styles.options}>
            {OPTIONS.map(opt => (
              <OptionButton
                key={opt}
                label={opt}
                chosen={answers[i]}
                correct={stmt.answer}
                revealed={!!revealed[i]}
                onClick={() => choose(i, opt)}
              />
            ))}
          </div>
          {revealed[i] && (
            <div style={styles.explanation}>{stmt.explanation}</div>
          )}
        </div>
      ))}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  progress: { fontSize: '12px', color: TEXT_MUTED },
  stmt: { display: 'flex', flexDirection: 'column', gap: '8px' },
  stmtText: { fontSize: '14px', color: TEXT_PRIMARY, lineHeight: '1.5', fontWeight: '500' },
  options: { display: 'flex', gap: '6px' },
  option: {
    flex: 1,
    padding: '8px 4px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  explanation: {
    fontSize: '12px',
    color: TEXT_MUTED,
    lineHeight: '1.5',
    background: '#F5F9F7',
    border: `1px solid ${BORDER}`,
    borderRadius: '8px',
    padding: '8px 10px'
  }
}
