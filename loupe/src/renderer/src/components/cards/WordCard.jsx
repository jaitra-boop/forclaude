import React, { useState } from 'react'
import {
  BG_SURFACE, BG_ELEVATED, BG_GLASS,
  BORDER_SUBTLE, BORDER_DEFAULT,
  GRAD_PRIMARY, GRAD_SECONDARY,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  PURPLE, AMBER,
  RADIUS_LG, RADIUS_MD, RADIUS_PILL,
  SHADOW_MD, FONT_BASE
} from '../../theme'

export default function WordCard({ word, definition, designer_tip, revealed, onReveal }) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    if (!revealed) onReveal()
    setFlipped(true)
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>
        <span style={styles.badgeDot} />
        Word of the Day · +0.5 drops
      </div>

      <div style={{ ...styles.card, cursor: flipped ? 'default' : 'pointer' }} onClick={!flipped ? handleFlip : undefined}>
        {/* Gradient accent top bar */}
        <div style={styles.accentBar} />

        {!flipped ? (
          <div style={styles.front}>
            <div style={styles.wordGlow} />
            <div style={styles.word}>{word}</div>
            {!revealed
              ? <div style={styles.hint}>Tap to reveal definition</div>
              : <div style={styles.alreadyRevealed}>Already revealed today</div>
            }
            <div style={styles.tapCue}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M4 9l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : (
          <div style={styles.back}>
            <div style={styles.backWordLabel}>{word}</div>
            <div style={styles.definition}>{definition}</div>
            <div style={styles.tipBox}>
              <div style={styles.tipLabel}>Designer Tip</div>
              <div style={styles.tip}>{designer_tip}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '7px', fontFamily: FONT_BASE },

  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: AMBER,
    letterSpacing: '0.4px',
    textTransform: 'uppercase'
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: AMBER,
    boxShadow: `0 0 8px ${AMBER}`
  },

  card: {
    background: BG_SURFACE,
    border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_LG,
    overflow: 'hidden',
    minHeight: '120px',
    position: 'relative',
    boxShadow: SHADOW_MD
  },

  accentBar: {
    height: '2px',
    background: GRAD_PRIMARY,
    width: '100%'
  },

  // Front face
  front: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 24px',
    gap: '8px',
    position: 'relative',
    minHeight: '118px'
  },
  wordGlow: {
    position: 'absolute',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(123,47,247,0.18) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  },
  word: {
    fontSize: '28px',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: '-0.8px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1
  },
  hint: {
    fontSize: '12px',
    color: TEXT_MUTED,
    position: 'relative',
    zIndex: 1
  },
  alreadyRevealed: {
    fontSize: '11px',
    color: TEXT_ACCENT,
    fontWeight: '500',
    position: 'relative',
    zIndex: 1
  },
  tapCue: {
    position: 'relative',
    zIndex: 1,
    marginTop: '4px'
  },

  // Back face
  back: {
    padding: '16px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  backWordLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: TEXT_ACCENT,
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  definition: {
    fontSize: '14px',
    color: TEXT_PRIMARY,
    lineHeight: '1.6'
  },
  tipBox: {
    background: 'rgba(123,47,247,0.10)',
    border: '1px solid rgba(123,47,247,0.2)',
    borderRadius: RADIUS_MD,
    padding: '12px 14px',
    marginTop: '4px'
  },
  tipLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: TEXT_ACCENT,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '5px'
  },
  tip: {
    fontSize: '13px',
    color: TEXT_SECONDARY,
    lineHeight: '1.55',
    fontStyle: 'italic'
  }
}
