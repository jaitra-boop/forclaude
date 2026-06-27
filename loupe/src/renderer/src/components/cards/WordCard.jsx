import React, { useState } from 'react'

const BG = '#FAF7F2'
const CARD_BG = '#FFFFFF'
const CARD_BACK_BG = '#F0EBE3'
const ACCENT = '#7BB8A0'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const DROP_BADGE = '#E8A020'

export default function WordCard({ word, definition, designer_tip, revealed, onReveal }) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    if (!revealed) {
      onReveal()
    }
    setFlipped(true)
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>Word of the Day · +0.5 drops</div>
      <div
        style={styles.card}
        onClick={!flipped ? handleFlip : undefined}
      >
        {!flipped ? (
          <div style={styles.front}>
            <div style={styles.word}>{word}</div>
            <div style={styles.hint}>Tap to reveal definition</div>
            {revealed && (
              <div style={styles.alreadyRevealed}>Already revealed today</div>
            )}
          </div>
        ) : (
          <div style={styles.back}>
            <div style={styles.backWord}>{word}</div>
            <div style={styles.definition}>{definition}</div>
            <div style={styles.tipLabel}>Designer Tip</div>
            <div style={styles.tip}>{designer_tip}</div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  badge: {
    fontSize: '11px',
    color: DROP_BADGE,
    fontWeight: '600',
    letterSpacing: '0.4px',
    textTransform: 'uppercase'
  },
  card: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: '14px',
    padding: '20px',
    cursor: 'pointer',
    minHeight: '100px',
    display: 'flex',
    alignItems: 'stretch'
  },
  front: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: '8px'
  },
  word: {
    fontSize: '26px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: '-0.5px',
    textAlign: 'center'
  },
  hint: {
    fontSize: '12px',
    color: TEXT_MUTED
  },
  alreadyRevealed: {
    fontSize: '11px',
    color: ACCENT,
    fontWeight: '500'
  },
  back: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%'
  },
  backWord: {
    fontSize: '14px',
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: '0.2px'
  },
  definition: {
    fontSize: '14px',
    color: TEXT_PRIMARY,
    lineHeight: '1.55'
  },
  tipLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginTop: '4px'
  },
  tip: {
    fontSize: '13px',
    color: TEXT_MUTED,
    lineHeight: '1.5',
    fontStyle: 'italic'
  }
}
