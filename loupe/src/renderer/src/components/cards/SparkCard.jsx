import React, { useState } from 'react'
import SortGame from '../../games/SortGame'
import JargonGame from '../../games/JargonGame'
import TrueFalseGame from '../../games/TrueFalseGame'
import TimelineGame from '../../games/TimelineGame'

const CARD_BG = '#FFFFFF'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const DROP_BADGE = '#E8A020'
const SPARK_COLOR = '#C48A5C'

const GAME_MAP = {
  sort: SortGame,
  jargon: JargonGame,
  truefalse: TrueFalseGame,
  timeline: TimelineGame
}

export default function SparkCard({ game, completed, onComplete }) {
  const [playing, setPlaying] = useState(false)

  const GameComponent = GAME_MAP[game.id]

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>Spark · +2 drops</div>
      <div style={styles.card}>
        {!playing && !completed && (
          <>
            <div style={styles.gameIcon}>⚡</div>
            <div style={styles.title}>{game.title}</div>
            <div style={styles.desc}>{game.description}</div>
            <button style={styles.playBtn} onClick={() => setPlaying(true)}>
              Play
            </button>
          </>
        )}

        {playing && !completed && GameComponent && (
          <GameComponent onComplete={onComplete} />
        )}

        {completed && (
          <div style={styles.done}>
            <div style={styles.doneIcon}>✓</div>
            <div style={styles.doneTitle}>{game.title} complete</div>
            <div style={styles.doneDesc}>+2 drops earned</div>
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
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center'
  },
  gameIcon: {
    fontSize: '32px',
    lineHeight: 1
  },
  title: {
    fontSize: '17px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center'
  },
  desc: {
    fontSize: '13px',
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: '1.5'
  },
  playBtn: {
    background: SPARK_COLOR,
    border: 'none',
    borderRadius: '8px',
    padding: '10px 32px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    cursor: 'pointer',
    marginTop: '4px'
  },
  done: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 0'
  },
  doneIcon: {
    fontSize: '28px',
    color: SPARK_COLOR
  },
  doneTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: TEXT_PRIMARY
  },
  doneDesc: {
    fontSize: '12px',
    color: TEXT_MUTED
  }
}
