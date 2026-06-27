import React, { useState } from 'react'
import { JARGON_DATA } from '../data/games'
import {
  BORDER_SUBTLE,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  SUCCESS, ERROR,
  RADIUS_MD, RADIUS_SM, RADIUS_PILL, FONT_BASE, FONT_MONO
} from '../theme'

const dayIndex = Math.floor(Date.now() / 86400000) % JARGON_DATA.length
const puzzle = JARGON_DATA[dayIndex]
const ANSWER = puzzle.answer

function LetterBox({ letter, guessed }) {
  const filled = guessed !== undefined
  const correct = filled && guessed === letter
  return (
    <div style={{
      ...styles.box,
      background: filled ? (correct ? 'rgba(0,212,161,0.2)' : 'rgba(255,77,106,0.2)') : 'rgba(255,255,255,0.05)',
      border: `1.5px solid ${filled ? (correct ? 'rgba(0,212,161,0.5)' : 'rgba(255,77,106,0.5)') : BORDER_SUBTLE}`,
      color: filled ? '#fff' : 'rgba(255,255,255,0.2)',
      boxShadow: filled && correct ? '0 0 10px rgba(0,212,161,0.3)' : 'none'
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
    const newG = [...guesses, val]
    setGuesses(newG)
    setInput('')
    if (val === ANSWER) {
      setDone(true); setWon(true)
      setTimeout(onComplete, 800)
    } else if (newG.length >= maxTries) {
      setDone(true)
      setTimeout(onComplete, 1500)
    }
  }

  const hintsCount = guesses.length >= 4 ? 5 : guesses.length >= 2 ? 3 : 1
  const hints = puzzle.clues.slice(0, hintsCount)

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <span style={styles.title}>Jargon Decoder</span>
        <span style={styles.triesLeft}>{maxTries - guesses.length} tries left</span>
      </div>

      <div style={styles.clueBox}>
        {hints.map((c, i) => (
          <div key={i} style={{ ...styles.clue, opacity: i === 0 ? 1 : 0.65 }}>
            <span style={styles.clueNum}>{i + 1}</span> {c}
          </div>
        ))}
        {hints.length < puzzle.clues.length && (
          <div style={styles.moreHints}>+{puzzle.clues.length - hints.length} hints unlock after more guesses</div>
        )}
      </div>

      <div style={styles.grid}>
        {Array.from({ length: maxTries }).map((_, ri) => (
          <div key={ri} style={styles.row}>
            {Array.from({ length: ANSWER.length }).map((__, ci) => (
              <LetterBox key={ci} letter={ANSWER[ci]} guessed={guesses[ri]?.[ci]} />
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
          <button style={styles.guessBtn} onClick={submit}>Guess</button>
        </div>
      )}

      {done && (
        <div style={styles.result}>
          {won
            ? <span style={{ color: SUCCESS, fontWeight: '700' }}>✓ Correct!</span>
            : <span style={{ color: TEXT_MUTED }}>Answer: <strong style={{ color: TEXT_PRIMARY }}>{ANSWER}</strong></span>
          }
        </div>
      )}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: FONT_BASE },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  triesLeft: { fontSize: '12px', color: TEXT_MUTED },

  clueBox: {
    background: 'rgba(123,47,247,0.08)',
    border: '1px solid rgba(123,47,247,0.2)',
    borderRadius: RADIUS_MD,
    padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: '5px'
  },
  clue: { fontSize: '12px', color: TEXT_SECONDARY, lineHeight: '1.5', display: 'flex', gap: '6px' },
  clueNum: { fontWeight: '800', color: TEXT_ACCENT, minWidth: '14px' },
  moreHints: { fontSize: '11px', color: TEXT_MUTED, fontStyle: 'italic', marginTop: '2px' },

  grid: { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' },
  row: { display: 'flex', gap: '4px' },
  box: {
    width: '36px', height: '36px', borderRadius: RADIUS_SM,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '800', fontFamily: FONT_MONO,
    transition: 'all 0.2s'
  },

  inputRow: { display: 'flex', gap: '8px' },
  input: {
    flex: 1, padding: '10px 14px',
    borderRadius: RADIUS_MD,
    border: `1.5px solid ${BORDER_SUBTLE}`,
    background: 'rgba(255,255,255,0.05)',
    color: TEXT_PRIMARY,
    fontSize: '15px', fontFamily: FONT_MONO, fontWeight: '700', letterSpacing: '4px',
    outline: 'none'
  },
  guessBtn: {
    background: 'linear-gradient(135deg,#7B2FF7,#2196F3)',
    border: 'none', borderRadius: RADIUS_MD,
    padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer'
  },
  result: { textAlign: 'center', fontSize: '14px' }
}
