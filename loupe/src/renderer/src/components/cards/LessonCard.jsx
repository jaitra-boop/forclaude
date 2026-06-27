import React, { useState } from 'react'
import {
  BG_SURFACE, BORDER_SUBTLE,
  GRAD_PRIMARY, GRAD_SECONDARY, GRAD_TEAL,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  SUCCESS, AMBER,
  RADIUS_LG, RADIUS_MD, RADIUS_SM, RADIUS_PILL,
  SHADOW_MD, FONT_BASE
} from '../../theme'

const CAT_STYLES = {
  Foundations: { grad: 'linear-gradient(135deg,#7B2FF7,#2196F3)', glow: 'rgba(123,47,247,0.3)' },
  Tools:       { grad: 'linear-gradient(135deg,#F72585,#7B2FF7)', glow: 'rgba(247,37,133,0.3)' },
  Workflow:    { grad: 'linear-gradient(135deg,#00C6FF,#0072FF)', glow: 'rgba(0,198,255,0.3)' },
  Industry:    { grad: 'linear-gradient(135deg,#F59E0B,#F72585)', glow: 'rgba(245,158,11,0.3)' }
}

export default function LessonCard({ title, category, read_time, content, takeaway, read, onRead }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CAT_STYLES[category] || CAT_STYLES.Foundations

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>
        <span style={styles.badgeDot} />
        Lesson · +1 drop
      </div>

      <div style={styles.card}>
        <div style={styles.accentBar} />

        <div style={styles.body}>
          {/* Meta row */}
          <div style={styles.metaRow}>
            <span style={{ ...styles.catPill, background: cat.grad, boxShadow: `0 2px 12px ${cat.glow}` }}>
              {category}
            </span>
            <span style={styles.readTime}>{read_time} min read</span>
          </div>

          <div style={styles.title}>{title}</div>

          {!expanded && (
            <button style={styles.expandBtn} onClick={() => setExpanded(true)}>
              Read lesson
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: '6px' }}>
                <path d="M3 5l4 4 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {expanded && (
            <>
              <div style={styles.content}>
                {content.map((para, i) => (
                  <p key={i} style={styles.para}>{para}</p>
                ))}
              </div>

              <div style={styles.takeawayBox}>
                <div style={styles.takeawayLabel}>Takeaway</div>
                <div style={styles.takeaway}>{takeaway}</div>
              </div>

              {!read ? (
                <button style={styles.readBtn} onClick={onRead}>
                  Mark as read · +1 drop
                </button>
              ) : (
                <div style={styles.readConfirm}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px' }}>
                    <path d="M2 7l4 4 6-7" stroke={SUCCESS} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Read today
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '7px', fontFamily: FONT_BASE },

  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: AMBER,
    letterSpacing: '0.4px',
    textTransform: 'uppercase'
  },
  badgeDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: AMBER, boxShadow: `0 0 8px ${AMBER}`
  },

  card: {
    background: BG_SURFACE,
    border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_LG,
    overflow: 'hidden',
    boxShadow: SHADOW_MD
  },
  accentBar: {
    height: '2px',
    background: GRAD_PRIMARY
  },
  body: {
    padding: '16px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },

  metaRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  catPill: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: '#fff',
    borderRadius: RADIUS_PILL,
    padding: '3px 10px'
  },
  readTime: { fontSize: '11px', color: TEXT_MUTED },

  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: '1.35',
    letterSpacing: '-0.2px'
  },

  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(123,47,247,0.15)',
    border: '1px solid rgba(123,47,247,0.25)',
    borderRadius: RADIUS_MD,
    padding: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: TEXT_ACCENT,
    cursor: 'pointer'
  },

  content: { display: 'flex', flexDirection: 'column', gap: '10px' },
  para: { fontSize: '14px', color: TEXT_SECONDARY, lineHeight: '1.65', margin: 0 },

  takeawayBox: {
    background: 'rgba(0,212,161,0.08)',
    border: '1px solid rgba(0,212,161,0.2)',
    borderRadius: RADIUS_MD,
    padding: '12px 14px'
  },
  takeawayLabel: {
    fontSize: '10px', fontWeight: '700', color: '#00D4A1',
    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '5px'
  },
  takeaway: { fontSize: '13px', color: TEXT_SECONDARY, lineHeight: '1.55', fontStyle: 'italic' },

  readBtn: {
    background: GRAD_PRIMARY,
    border: 'none',
    borderRadius: RADIUS_MD,
    padding: '12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(123,47,247,0.4)'
  },
  readConfirm: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: SUCCESS,
    fontWeight: '600'
  }
}
