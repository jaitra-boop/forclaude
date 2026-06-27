import React from 'react'

const BG = '#FAF7F2'
const ACTIVE = '#3D3530'
const INACTIVE = '#B5A99E'
const BORDER = '#E8DDD0'

const TABS = [
  { id: 'home', label: 'Today', icon: HomeIcon },
  { id: 'calendar', label: 'Calendar', icon: CalIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon }
]

function HomeIcon({ active }) {
  const c = active ? ACTIVE : INACTIVE
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 9L10 3L17 9V17H13V13H7V17H3V9Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function CalIcon({ active }) {
  const c = active ? ACTIVE : INACTIVE
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke={c} strokeWidth="1.5" fill="none" />
      <line x1="3" y1="8" x2="17" y2="8" stroke={c} strokeWidth="1.5" />
      <line x1="7" y1="2" x2="7" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="2" x2="13" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  const c = active ? ACTIVE : INACTIVE
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke={c} strokeWidth="1.5" fill="none" />
      <path d="M3 17C3 13.686 6.134 11 10 11C13.866 11 17 13.686 17 17" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function BottomNav({ tab, onChange }) {
  return (
    <div style={styles.nav}>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          style={{ ...styles.tab, ...(tab === id ? styles.activeTab : {}) }}
          onClick={() => onChange(id)}
        >
          <Icon active={tab === id} />
          <span style={{ ...styles.label, color: tab === id ? ACTIVE : INACTIVE }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}

const styles = {
  nav: {
    display: 'flex',
    background: BG,
    borderTop: `1px solid ${BORDER}`,
    padding: '6px 0 10px'
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '4px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  activeTab: {},
  label: {
    fontSize: '10px',
    fontWeight: '500',
    letterSpacing: '0.2px'
  }
}
