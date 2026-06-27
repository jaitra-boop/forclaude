import React, { useState } from 'react'

const CARD_BG = '#FFFFFF'
const ACCENT = '#7BB8A0'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const DROP_BADGE = '#E8A020'
const CATEGORY_COLORS = {
  Foundations: '#7BB8A0',
  Tools: '#C48A5C',
  Workflow: '#7B9EC4',
  Industry: '#C47B9E'
}

export default function LessonCard({ title, category, read_time, content, takeaway, read, onRead }) {
  const [expanded, setExpanded] = useState(false)
  const catColor = CATEGORY_COLORS[category] || TEXT_MUTED

  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>Lesson · +1 drop</div>
      <div style={styles.card}>
        <div style={styles.meta}>
          <span style={{ ...styles.category, color: catColor, borderColor: catColor }}>{category}</span>
          <span style={styles.readTime}>{read_time} min read</span>
        </div>
        <div style={styles.title}>{title}</div>

        {!expanded && (
          <button style={styles.expandBtn} onClick={() => setExpanded(true)}>
            Read lesson
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
              <div style={styles.readConfirm}>✓ Read today</div>
            )}
          </>
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
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  category: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    border: '1px solid',
    borderRadius: '20px',
    padding: '2px 8px'
  },
  readTime: {
    fontSize: '11px',
    color: TEXT_MUTED
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: '1.35',
    letterSpacing: '-0.2px'
  },
  expandBtn: {
    background: '#F0EBE3',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: TEXT_PRIMARY,
    cursor: 'pointer',
    textAlign: 'center'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  para: {
    fontSize: '14px',
    color: TEXT_PRIMARY,
    lineHeight: '1.6',
    margin: 0
  },
  takeawayBox: {
    background: '#F5F9F7',
    border: `1px solid ${ACCENT}`,
    borderRadius: '10px',
    padding: '12px 14px'
  },
  takeawayLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  takeaway: {
    fontSize: '13px',
    color: TEXT_PRIMARY,
    lineHeight: '1.5',
    fontStyle: 'italic'
  },
  readBtn: {
    background: ACCENT,
    border: 'none',
    borderRadius: '8px',
    padding: '11px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#FFFFFF',
    cursor: 'pointer',
    textAlign: 'center'
  },
  readConfirm: {
    textAlign: 'center',
    fontSize: '13px',
    color: ACCENT,
    fontWeight: '600'
  }
}
