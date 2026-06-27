import React, { useState } from 'react'
import SortGame from '../../games/SortGame'
import JargonGame from '../../games/JargonGame'
import TrueFalseGame from '../../games/TrueFalseGame'
import TimelineGame from '../../games/TimelineGame'
import {
  BG_SURFACE, BORDER_SUBTLE,
  GRAD_SECONDARY, GRAD_PRIMARY,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  AMBER, SUCCESS,
  RADIUS_LG, RADIUS_MD, RADIUS_PILL,
  SHADOW_MD, FONT_BASE
} from '../../theme'

const GAME_MAP = { sort: SortGame, jargon: JargonGame, truefalse: TrueFalseGame, timeline: TimelineGame }

export default function SparkCard({ game, completed, onComplete }) {
  const [playing, setPlaying] = useState(false)
  const GameComponent = GAME_MAP[game.id]

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>
        <span style={styles.badgeDot} />
        Spark · +2 drops
      </div>

      <div style={styles.card}>
        <div style={styles.accentBar} />

        <div style={styles.body}>
          {!playing && !completed && (
            <div style={styles.intro}>
              <div style={styles.gameIconWrap}>
                <span style={styles.gameIcon}>⚡</span>
              </div>
              <div style={styles.gameTitle}>{game.title}</div>
              <div style={styles.gameDesc}>{game.description}</div>
              <button style={styles.playBtn} onClick={() => setPlaying(true)}>
                Play now
              </button>
            </div>
          )}

          {playing && !completed && GameComponent && (
            <GameComponent onComplete={onComplete} />
          )}

          {completed && (
            <div style={styles.done}>
              <div style={styles.doneRing}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6 6 12-12" stroke={SUCCESS} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={styles.doneTitle}>{game.title} complete</div>
              <div style={styles.doneDrops}>+2 drops earned</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '7px', fontFamily: FONT_BASE },

  badge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: '600', color: AMBER,
    letterSpacing: '0.4px', textTransform: 'uppercase'
  },
  badgeDot: { width: '6px', height: '6px', borderRadius: '50%', background: AMBER, boxShadow: `0 0 8px ${AMBER}` },

  card: {
    background: BG_SURFACE,
    border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_LG,
    overflow: 'hidden',
    boxShadow: SHADOW_MD
  },
  accentBar: { height: '2px', background: GRAD_SECONDARY },
  body: { padding: '18px' },

  intro: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '8px 0'
  },
  gameIconWrap: {
    width: '56px', height: '56px', borderRadius: '18px',
    background: 'linear-gradient(135deg,rgba(247,37,133,0.2),rgba(123,47,247,0.2))',
    border: '1px solid rgba(247,37,133,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '4px'
  },
  gameIcon: { fontSize: '28px', lineHeight: 1 },
  gameTitle: { fontSize: '17px', fontWeight: '700', color: TEXT_PRIMARY, textAlign: 'center' },
  gameDesc: { fontSize: '13px', color: TEXT_MUTED, textAlign: 'center', lineHeight: '1.5' },

  playBtn: {
    background: GRAD_SECONDARY,
    border: 'none',
    borderRadius: RADIUS_PILL,
    padding: '11px 36px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 4px 16px rgba(247,37,133,0.35)'
  },

  done: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0'
  },
  doneRing: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: 'rgba(0,212,161,0.12)', border: '2px solid rgba(0,212,161,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  doneTitle: { fontSize: '15px', fontWeight: '700', color: TEXT_PRIMARY },
  doneDrops: { fontSize: '12px', color: TEXT_MUTED }
}
