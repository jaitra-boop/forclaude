import React from 'react'
import { GRAD_PRIMARY, BG_GLASS, BORDER_DEFAULT, TEXT_PRIMARY, TEXT_MUTED, RADIUS_PILL } from '../theme'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div style={styles.track}>
      {['learn', 'wander'].map(m => (
        <button
          key={m}
          style={{
            ...styles.option,
            ...(mode === m ? styles.active : styles.inactive)
          }}
          onClick={() => onChange(m)}
        >
          {m === 'learn' ? 'Learn' : 'Wander'}
        </button>
      ))}
    </div>
  )
}

const styles = {
  track: {
    display: 'flex',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS_PILL,
    padding: '3px',
    gap: '2px',
    border: '1px solid rgba(255,255,255,0.10)'
  },
  option: {
    padding: '5px 14px',
    borderRadius: RADIUS_PILL,
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.2px',
    transition: 'all 0.18s ease'
  },
  active: {
    background: 'linear-gradient(135deg, #7B2FF7 0%, #2196F3 100%)',
    color: '#FFFFFF',
    boxShadow: '0 2px 12px rgba(123,47,247,0.45)'
  },
  inactive: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)'
  }
}
