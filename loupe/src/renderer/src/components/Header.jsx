import React from 'react'
import Jar from './Jar'
import ModeToggle from './ModeToggle'
import {
  BG_BASE, BORDER_SUBTLE, TEXT_PRIMARY, TEXT_MUTED,
  TEXT_ACCENT, RADIUS_SM, FONT_BASE
} from '../theme'

export default function Header({ tab, mode, onModeChange, jarPct, jarCracks, jarGlowing, onClose, onMinimize }) {
  const tabLabels = { home: 'Today', calendar: 'Calendar', profile: 'Profile' }

  return (
    <div style={styles.header}>
      {/* Window drag region */}
      <div style={styles.dragRow}>
        <div style={styles.left}>
          <span style={styles.appName}>Loupe</span>
          <span style={styles.dot}>·</span>
          <span style={styles.tabName}>{tabLabels[tab] || ''}</span>
        </div>

        <div style={styles.right}>
          {tab === 'home' && (
            <ModeToggle mode={mode} onChange={onModeChange} />
          )}
          <Jar pct={jarPct} cracks={jarCracks} glowing={jarGlowing} />
        </div>
      </div>

      {/* Frameless window controls – top-right */}
      <div style={styles.controls}>
        <button style={styles.ctrlBtn} onClick={onMinimize} title="Minimize">
          <svg width="8" height="2" viewBox="0 0 8 2"><rect width="8" height="2" rx="1" fill="rgba(255,255,255,0.5)" /></svg>
        </button>
        <button style={styles.ctrlBtn} onClick={onClose} title="Close">
          <svg width="8" height="8" viewBox="0 0 8 8">
            <line x1="0" y1="0" x2="8" y2="8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Bottom separator */}
      <div style={styles.separator} />
    </div>
  )
}

const styles = {
  header: {
    background: 'rgba(9,11,24,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '14px 16px 12px',
    position: 'relative',
    WebkitAppRegion: 'drag',
    fontFamily: FONT_BASE
  },
  dragRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  appName: {
    fontSize: '15px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: '-0.3px'
  },
  dot: {
    color: TEXT_MUTED,
    fontSize: '14px'
  },
  tabName: {
    fontSize: '14px',
    color: TEXT_MUTED,
    fontWeight: '400'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    WebkitAppRegion: 'no-drag'
  },
  controls: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    gap: '6px',
    WebkitAppRegion: 'no-drag'
  },
  ctrlBtn: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(123,47,247,0.4), rgba(33,150,243,0.4), transparent)'
  }
}
