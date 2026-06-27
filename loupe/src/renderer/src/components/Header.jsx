import React from 'react'
import Jar from './Jar'
import ModeToggle from './ModeToggle'

const BG = '#FAF7F2'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'

export default function Header({ tab, mode, onModeChange, jarPct, jarCracks, jarGlowing, onClose, onMinimize }) {
  const tabLabels = { home: 'Today', calendar: 'Calendar', profile: 'Profile' }

  return (
    <div style={styles.header}>
      <div style={styles.dragArea}>
        <div style={styles.left}>
          <span style={styles.appName}>Loupe</span>
          <span style={styles.separator}>·</span>
          <span style={styles.tabName}>{tabLabels[tab] || ''}</span>
        </div>
        <div style={styles.right}>
          {tab === 'home' && (
            <ModeToggle mode={mode} onChange={onModeChange} />
          )}
          <Jar pct={jarPct} cracks={jarCracks} glowing={jarGlowing} />
        </div>
      </div>
      <div style={styles.windowControls}>
        <button style={styles.controlBtn} onClick={onMinimize} title="Minimize">―</button>
        <button style={{ ...styles.controlBtn, ...styles.closeBtn }} onClick={onClose} title="Close">×</button>
      </div>
    </div>
  )
}

const styles = {
  header: {
    background: BG,
    borderBottom: `1px solid ${BORDER}`,
    padding: '12px 16px 10px',
    position: 'relative',
    WebkitAppRegion: 'drag'
  },
  dragArea: {
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
  separator: {
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
  windowControls: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    display: 'flex',
    gap: '4px',
    WebkitAppRegion: 'no-drag'
  },
  controlBtn: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: 'none',
    background: BORDER,
    color: TEXT_MUTED,
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1
  },
  closeBtn: {
    fontSize: '16px'
  }
}
