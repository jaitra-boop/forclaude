import React, { useState } from 'react'
import { TRUEFALSE_DATA } from '../data/games'
import {
  BORDER_SUBTLE,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  SUCCESS, ERROR,
  RADIUS_MD, RADIUS_SM, RADIUS_PILL, FONT_BASE
} from '../theme'

const setIndex = Math.floor(Date.now() / 86400000) % TRUEFALSE_DATA.length
const STATEMENTS = TRUEFALSE_DATA[setIndex].statements

const OPT_STYLES = {
  True:       { grad: 'linear-gradient(135deg,#00D4A1,#0072FF)', glow: 'rgba(0,212,161,0.35)' },
  False:      { grad: 'linear-gradient(135deg,#FF4D6A,#F72585)', glow: 'rgba(255,77,106,0.35)' },
  'It Depends': { grad: 'linear-gradient(135deg,#F59E0B,#F72585)', glow: 'rgba(245,158,11,0.35)' }
}

export default function TrueFalseGame({ onComplete }) {
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  function choose(idx, option) {
    if (revealed[idx]) return
    const newA = { ...answers, [idx]: option }
    const newR = { ...revealed, [idx]: true }
    setAnswers(newA)
    setRevealed(newR)
    if (Object.keys(newR).length === STATEMENTS.length) {
      setTimeout(onComplete, 1000)
    }
  }

  return (
    <div style={styles.game}>
      <div style={styles.header}>
        <span style={styles.title}>True / False / It Depends</span>
        <span style={styles.prog}>{Object.keys(revealed).length}/{STATEMENTS.length}</span>
      </div>

      {STATEMENTS.map((stmt, i) => {
        const chosen = answers[i]
        const isRev = !!revealed[i]
        return (
          <div key={i} style={styles.stmt}>
            <div style={styles.stmtText}>{stmt.text}</div>
            <div style={styles.options}>
              {['True', 'False', 'It Depends'].map(opt => {
                const s = OPT_STYLES[opt]
                const isChosen = chosen === opt
                const isCorrect = opt === stmt.answer

                let bg = 'rgba(255,255,255,0.06)'
                let border = BORDER_SUBTLE
                let color = TEXT_MUTED
                let shadow = 'none'

                if (isRev && isCorrect) { bg = `${s.grad}`; border = 'transparent'; color = '#fff'; shadow = `0 4px 16px ${s.glow}` }
                else if (isRev && isChosen && !isCorrect) { bg = 'rgba(255,77,106,0.15)'; border = 'rgba(255,77,106,0.4)'; color = '#FF4D6A' }
                else if (!isRev && isChosen) { bg = 'rgba(255,255,255,0.12)'; border = 'rgba(255,255,255,0.25)'; color = '#fff' }

                return (
                  <button
                    key={opt}
                    style={{
                      ...styles.opt,
                      background: bg,
                      border: `1px solid ${border}`,
                      color,
                      boxShadow: shadow,
                      cursor: isRev ? 'default' : 'pointer'
                    }}
                    onClick={() => choose(i, opt)}
                    disabled={isRev}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {isRev && (
              <div style={styles.explanation}>{stmt.explanation}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  game: { width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: FONT_BASE },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '14px', fontWeight: '700', color: TEXT_PRIMARY },
  prog: { fontSize: '12px', color: TEXT_MUTED },

  stmt: { display: 'flex', flexDirection: 'column', gap: '8px' },
  stmtText: { fontSize: '14px', color: TEXT_PRIMARY, lineHeight: '1.5', fontWeight: '500' },

  options: { display: 'flex', gap: '6px' },
  opt: {
    flex: 1, padding: '9px 4px', border: '1px solid', borderRadius: RADIUS_SM,
    fontSize: '11px', fontWeight: '700', transition: 'all 0.15s', letterSpacing: '0.2px'
  },

  explanation: {
    fontSize: '12px', color: TEXT_SECONDARY, lineHeight: '1.55',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_SM, padding: '9px 11px'
  }
}
