import React from 'react'
import {
  BG_SURFACE, BORDER_SUBTLE,
  GRAD_TEAL,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  CYAN, BLUE, AMBER, SUCCESS,
  RADIUS_LG, RADIUS_MD, RADIUS_PILL,
  SHADOW_MD, FONT_MONO, FONT_BASE
} from '../../theme'

export default function WanderCard({ title, url, desc, tag, opened, onOpen }) {
  function handleOpen() {
    window.open(url, '_blank')
    if (!opened) onOpen()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>
        <span style={styles.badgeDot} />
        Brain Candy · +0.5 drops
      </div>

      <div style={styles.card}>
        {/* Ambient glow */}
        <div style={styles.glow} />

        <div style={styles.body}>
          <div style={styles.topRow}>
            <span style={styles.tag}>{tag}</span>
            {opened && (
              <span style={styles.visited}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginRight: '4px' }}>
                  <path d="M1.5 5l2.5 2.5 4.5-5" stroke={SUCCESS} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Visited
              </span>
            )}
          </div>

          <div style={styles.title}>{title}</div>
          <div style={styles.desc}>{desc}</div>

          <div style={styles.urlRow}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: '5px', flexShrink: 0 }}>
              <circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <path d="M4 6c0-1.1.45-2 1-2.5M8 6c0 1.1-.45 2-1 2.5M2 6h8" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span style={styles.url}>{url.replace('https://', '')}</span>
          </div>

          <button style={styles.openBtn} onClick={handleOpen}>
            Open link
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: '6px' }}>
              <path d="M5 3h6v6M11 3L3 11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div style={styles.switchHint}>
        Want to learn something today?&nbsp;
        <button style={styles.switchLink} onClick={() => {}}>Switch to Learn mode</button>
        &nbsp;in the header.
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT_BASE },

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
    position: 'relative',
    boxShadow: SHADOW_MD
  },
  glow: {
    position: 'absolute',
    top: '-40px', right: '-40px',
    width: '180px', height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,198,255,0.15) 0%, transparent 70%)',
    pointerEvents: 'none'
  },
  body: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' },

  topRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  tag: {
    fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase',
    color: CYAN, border: `1px solid rgba(0,198,255,0.3)`, borderRadius: RADIUS_PILL, padding: '3px 10px'
  },
  visited: {
    display: 'flex', alignItems: 'center',
    fontSize: '11px', color: SUCCESS, fontWeight: '600'
  },

  title: { fontSize: '22px', fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: '-0.5px', lineHeight: '1.2' },
  desc: { fontSize: '14px', color: TEXT_SECONDARY, lineHeight: '1.6' },

  urlRow: { display: 'flex', alignItems: 'center' },
  url: { fontSize: '11px', color: TEXT_MUTED, fontFamily: FONT_MONO },

  openBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: GRAD_TEAL,
    border: 'none', borderRadius: RADIUS_MD,
    padding: '12px',
    fontSize: '13px', fontWeight: '600', color: '#fff',
    cursor: 'pointer', marginTop: '4px',
    boxShadow: '0 4px 16px rgba(0,198,255,0.3)'
  },

  switchHint: { fontSize: '12px', color: TEXT_MUTED, textAlign: 'center', lineHeight: '1.5' },
  switchLink: {
    background: 'none', border: 'none', color: TEXT_ACCENT,
    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
    textDecoration: 'underline', textDecorationColor: 'rgba(167,139,250,0.4)', padding: 0
  }
}
