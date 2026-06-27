import React from 'react'

const TRACK_ACTIVE = '#3D3530'
const TRACK_INACTIVE = '#E8DDD0'
const TEXT_ACTIVE = '#FAF7F2'
const TEXT_INACTIVE = '#8A7D72'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.option,
          background: mode === 'learn' ? TRACK_ACTIVE : TRACK_INACTIVE,
          color: mode === 'learn' ? TEXT_ACTIVE : TEXT_INACTIVE
        }}
        onClick={() => onChange('learn')}
      >
        Learn
      </button>
      <button
        style={{
          ...styles.option,
          background: mode === 'wander' ? TRACK_ACTIVE : TRACK_INACTIVE,
          color: mode === 'wander' ? TEXT_ACTIVE : TEXT_INACTIVE
        }}
        onClick={() => onChange('wander')}
      >
        Wander
      </button>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    background: '#E8DDD0',
    borderRadius: '20px',
    padding: '2px',
    gap: '2px'
  },
  option: {
    padding: '4px 12px',
    borderRadius: '18px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    transition: 'all 0.18s ease'
  }
}
