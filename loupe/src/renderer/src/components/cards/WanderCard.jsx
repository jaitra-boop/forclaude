import React from 'react'

const CARD_BG = '#FFFFFF'
const ACCENT = '#7B9EC4'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const DROP_BADGE = '#E8A020'

export default function WanderCard({ title, url, desc, tag, opened, onOpen }) {
  function handleOpen() {
    window.open(url, '_blank')
    if (!opened) onOpen()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>Brain Candy · +0.5 drops</div>
      <div style={styles.card}>
        <div style={styles.tagRow}>
          <span style={styles.tag}>{tag}</span>
          {opened && <span style={styles.opened}>✓ Visited</span>}
        </div>
        <div style={styles.title}>{title}</div>
        <div style={styles.desc}>{desc}</div>
        <div style={styles.urlRow}>
          <span style={styles.url}>{url.replace('https://', '')}</span>
        </div>
        <button style={styles.openBtn} onClick={handleOpen}>
          Open link
        </button>
      </div>

      <div style={styles.switchHint}>
        Want to learn something today? Switch to{' '}
        <button style={styles.switchLink} onClick={() => {}}>Learn mode</button>
        {' '}in the header.
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
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
    gap: '10px'
  },
  tagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tag: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    color: ACCENT,
    border: `1px solid ${ACCENT}`,
    borderRadius: '20px',
    padding: '2px 8px'
  },
  opened: {
    fontSize: '11px',
    color: ACCENT,
    fontWeight: '600'
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: '-0.3px'
  },
  desc: {
    fontSize: '14px',
    color: TEXT_MUTED,
    lineHeight: '1.55'
  },
  urlRow: {
    display: 'flex'
  },
  url: {
    fontSize: '11px',
    color: TEXT_MUTED,
    fontFamily: 'monospace'
  },
  openBtn: {
    background: ACCENT,
    border: 'none',
    borderRadius: '8px',
    padding: '11px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#FFFFFF',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '4px'
  },
  switchHint: {
    fontSize: '12px',
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: '1.5'
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: TEXT_PRIMARY,
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0
  }
}
