import React, { useState } from 'react'
import { JARGON_DATA } from '../data/games'

const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const ACCENT = '#7BB8A0'
const ERROR = '#D4544A'
const HINT_BG = '#F5F9F7'

const dayIndex = Math.floor(Date.now() / 86400000) % JARGON_DATA.length
const puzzle = JARGON_DATA[dayIndex]
const ANSWER = puzzle.answer

function LetterBox({ letter, guessed }) {
  const filled = guessed !== undefined
  return (
    <div style={{
      ...styles.letterBox,
      background: guessed === letter ? ACCENT : (filled ? ERROR : '#F0EBE3'),
      color: filled ? '#FFFFFF' : BORDER,
      borderColor: filled ? 'transparent' : BORDER
    }}>
      {filled ? guessed : ''}
    </div>
  )
}

export default function JargonGame({ onComplete }) {
  const [guesses, setGuesses] = useState([])
  const [input, setInput] = useState('')
  const [done, setDone] = useState(false)
  const [won, setWon] = useState(false)
  const maxTries = 5

  function submit() {
    const val = input.toUpperCase().trim()
    if (val.length !== ANSWER.length) return
    const newGuesses = [...guesses, val]
    setGuesses(newGuesses)
    setInput('')
    if (val === ANSWER) {
      setDone(true)
      setWon(true)
      setTimeout(onComplete, 800)
    } else if (newGuesses.length >= maxTries) {
      setDone(true)
      setTimeout(onComplete, 1500)
    }
  }

  const hintsToShow = guesses.length >= 2 ? (guesses.length >= 4 ? puzzle.clues.slice(0, 5) : puzzle.clues.slice(0, 3)) : puzzle.clues.slice(0, 1)

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <div style={styles.title}>Jargon Decoder</div>
        <div style={styles.triesLeft}>{maxTries - guesses.length} tries left</div>
      </div>

      <div style={styles.clues}>
        {hintsToShow.map((clue, i) => (
          <div key={i} style={{ ...styles.clue, ...(i === 0 ? {} : { opacity: 0.7 }) }}>
            <span style={styles.clueNum}>{i + 1}.</span> {clue}
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        {Array.from({ length: maxTries }).map((_, ri) => (
          <div key={ri} style={styles.row}>
            {Array.from({ length: ANSWER.length }).map((__, ci) => (
              <LetterBox
                key={ci}
                letter={ANSWER[ci]}
                guessed={guesses[ri] ? guesses[ri][ci] : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      {!done && (
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase().slice(0, ANSWER.length))}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={`${ANSWER.length} letters`}
            maxLength={ANSWER.length}
            autoFocus
          />
          <button style={styles.submitBtn} onClick={submit}>Guess</button>
        </div>
      )}

      {done && (
        <div style={styles.result}>
          {won ? (
            <span style={{ color: ACCENT, fontWeight: '700' }}>✓ Got it!</span>
          ) : (
            <span style={{ color: TEXT_MUTED }}>Answer: <strong style={{ color: TEXT_PRIMARY }}>{ANSWER}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  triesLeft: { fontSize: '12px', color: TEXT_MUTED },
  clues: { background: HINT_BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  clue: { fontSize: '12px', color: TEXT_PRIMARY, lineHeight: '1.5' },
  clueNum: { fontWeight: '700', color: ACCENT },
  grid: { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' },
  row: { display: 'flex', gap: '4px' },
  letterBox: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  inputRow: { display: 'flex', gap: '8px' },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1.5px solid ${BORDER}`,
    fontSize: '14px',
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: '3px',
    outline: 'none',
    background: '#FFFFFF',
    color: TEXT_PRIMARY
  },
  submitBtn: {
    background: TEXT_PRIMARY,
    color: '#FAF7F2',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  result: { textAlign: 'center', fontSize: '14px' }
}
