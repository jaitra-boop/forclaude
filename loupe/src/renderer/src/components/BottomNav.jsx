import React from 'react'
import {
  BG_BASE, BORDER_SUBTLE, TEXT_PRIMARY, TEXT_MUTED,
  GRAD_PRIMARY, PURPLE, BLUE, FONT_BASE
} from '../theme'

const TABS = [
  { id: 'home',     label: 'Today',    Icon: HomeIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalIcon },
  { id: 'profile',  label: 'Profile',  Icon: ProfileIcon }
]

function HomeIcon({ active }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.38)'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 9L10 3L17 9V17H13V13H7V17H3V9Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function CalIcon({ active }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.38)'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke={c} strokeWidth="1.5" />
      <line x1="3" y1="8" x2="17" y2="8" stroke={c} strokeWidth="1.5" />
      <line x1="7" y1="2" x2="7" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="2" x2="13" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.38)'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke={c} strokeWidth="1.5" />
      <path d="M3 17C3 13.686 6.134 11 10 11C13.866 11 17 13.686 17 17" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function BottomNav({ tab, onChange }) {
  return (
    <div style={styles.nav}>
      {/* Top gradient line */}
      <div style={styles.topLine} />
      <div style={styles.inner}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button key={id} style={styles.tab} onClick={() => onChange(id)}>
              <div style={{ ...styles.iconWrap, ...(active ? styles.iconActive : {}) }}>
                <Icon active={active} />
              </div>
              <span style={{ ...styles.label, color: active ? '#fff' : 'rgba(255,255,255,0.38)' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  nav: {
    background: 'rgba(9,11,24,0.96)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'relative',
    fontFamily: FONT_BASE
  },
  topLine: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(123,47,247,0.4), rgba(33,150,243,0.4), transparent)'
  },
  inner: {
    display: 'flex',
    padding: '8px 0 14px'
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  iconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  iconActive: {
    background: 'linear-gradient(135deg, rgba(123,47,247,0.3) 0%, rgba(33,150,243,0.3) 100%)',
    boxShadow: '0 0 16px rgba(123,47,247,0.3)'
  },
  label: {
    fontSize: '10px',
    fontWeight: '500',
    letterSpacing: '0.2px'
  }
}
