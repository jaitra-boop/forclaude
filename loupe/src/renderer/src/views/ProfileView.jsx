import React, { useState } from 'react'
import Jar from '../components/Jar'
import { WORDS } from '../data/words'
import {
  BG_BASE, BG_SURFACE, BORDER_SUBTLE,
  GRAD_PRIMARY,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_ACCENT,
  SUCCESS, AMBER, PURPLE,
  RADIUS_LG, RADIUS_MD, RADIUS_SM, RADIUS_PILL, FONT_BASE, FONT_MONO
} from '../theme'

const MILESTONES = [
  { id: 'first_drop', label: 'First Drop',  icon: '💧', drops: 1 },
  { id: 'one_week',   label: 'One Week',    icon: '🌿', days: 7 },
  { id: 'two_weeks',  label: 'Two Weeks',   icon: '✨', days: 14 },
  { id: 'full_jar',   label: 'Full Jar',    icon: '🫙', drops: 120 }
]

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statVal, color: accent || TEXT_PRIMARY }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

export default function ProfileView({ appData }) {
  const [bankOpen, setBankOpen] = useState(false)

  const streak      = appData?.streakCount || 0
  const totalDrops  = appData?.totalDrops || 0
  const learned     = appData?.learnedWords || []
  const completions = appData?.completions || {}

  const daysLogged = Object.keys(completions).filter(d => (completions[d]?.drops||0) > 0).length
  const fullDays   = Object.keys(completions).filter(d => (completions[d]?.drops||0) >= 4).length

  const jarPct   = Math.min(100, (totalDrops / 120) * 100)
  const glowing  = streak >= 7
  const daysLeft = Math.max(0, Math.ceil((120 - totalDrops) / 4))

  const wordMap = Object.fromEntries(WORDS.map(w => [w.word, w.definition]))

  function msAchieved(ms) {
    if (ms.drops !== undefined) return totalDrops >= ms.drops
    if (ms.days !== undefined)  return streak >= ms.days || daysLogged >= ms.days
    return false
  }
  function msAway(ms) {
    if (ms.drops !== undefined) return `${(ms.drops - totalDrops).toFixed(1)} drops away`
    if (ms.days !== undefined)  return `${ms.days - Math.max(streak, daysLogged)} days away`
    return ''
  }

  return (
    <div style={styles.view}>
      {/* Stats */}
      <div style={styles.statsGrid}>
        <StatCard label="Day streak"    value={streak}         accent="linear-gradient(135deg,#7B2FF7,#2196F3)" />
        <StatCard label="Days logged"   value={daysLogged} />
        <StatCard label="Full days"     value={fullDays}       accent={SUCCESS} />
        <StatCard label="Words learned" value={learned.length} accent={AMBER} />
      </div>

      {/* Jar */}
      <div style={styles.jarCard}>
        <div style={styles.jarRow}>
          <Jar pct={jarPct} glowing={glowing} cracks={0} />
          <div style={styles.jarInfo}>
            <div style={styles.jarDropVal}>{totalDrops.toFixed(1)}</div>
            <div style={styles.jarDropUnit}>drops of 120</div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${jarPct}%` }} />
            </div>
            <div style={styles.jarEta}>
              {totalDrops >= 120
                ? '🎉 Jar complete! New jar begins.'
                : `~${daysLeft} days to fill`}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Milestones</div>
        <div style={styles.msList}>
          {MILESTONES.map(ms => {
            const done = msAchieved(ms)
            return (
              <div key={ms.id} style={{ ...styles.msItem, opacity: done ? 1 : 0.45 }}>
                <div style={{ ...styles.msIconWrap, background: done ? 'rgba(0,212,161,0.12)' : 'rgba(255,255,255,0.04)', border: done ? '1px solid rgba(0,212,161,0.25)' : `1px solid ${BORDER_SUBTLE}` }}>
                  <span style={styles.msIcon}>{ms.icon}</span>
                </div>
                <div style={styles.msBody}>
                  <div style={styles.msLabel}>{ms.label}</div>
                  <div style={styles.msMeta}>{done ? 'Achieved' : msAway(ms)}</div>
                </div>
                {done && (
                  <div style={styles.msDone}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-7" stroke={SUCCESS} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Word bank */}
      <div style={styles.section}>
        <button style={styles.bankHeader} onClick={() => setBankOpen(o => !o)}>
          <span style={styles.sectionTitle}>Word Bank ({learned.length})</span>
          <span style={styles.bankArrow}>{bankOpen ? '▲' : '▼'}</span>
        </button>
        {bankOpen && (
          <div style={styles.bankList}>
            {learned.length === 0 && (
              <div style={styles.bankEmpty}>Reveal today's word to start your collection.</div>
            )}
            {learned.map(w => (
              <div key={w} style={styles.wordEntry}>
                <div style={styles.wordTerm}>{w}</div>
                <div style={styles.wordDef}>{wordMap[w] || ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  view: {
    flex: 1, overflowY: 'auto', background: BG_BASE,
    padding: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: '16px',
    fontFamily: FONT_BASE
  },

  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statCard: {
    background: BG_SURFACE, border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_MD, padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '5px'
  },
  statVal: {
    fontSize: '30px', fontWeight: '900', lineHeight: 1, letterSpacing: '-1px',
    background: GRAD_PRIMARY, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
  },
  statLabel: { fontSize: '11px', color: TEXT_MUTED, fontWeight: '500' },

  jarCard: {
    background: BG_SURFACE, border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_LG, padding: '18px'
  },
  jarRow: { display: 'flex', alignItems: 'center', gap: '18px' },
  jarInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  jarDropVal: { fontSize: '26px', fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: '-0.8px', lineHeight: 1 },
  jarDropUnit: { fontSize: '12px', color: TEXT_MUTED },
  progressBar: { height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: RADIUS_PILL, overflow: 'hidden', marginTop: '2px' },
  progressFill: { height: '100%', background: GRAD_PRIMARY, borderRadius: RADIUS_PILL, transition: 'width 0.5s ease', boxShadow: '0 0 8px rgba(123,47,247,0.5)' },
  jarEta: { fontSize: '11px', color: TEXT_MUTED, fontStyle: 'italic' },

  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sectionTitle: { fontSize: '13px', fontWeight: '700', color: TEXT_PRIMARY },

  msList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  msItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: BG_SURFACE, border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_MD, padding: '12px 14px', transition: 'opacity 0.2s'
  },
  msIconWrap: { width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msIcon: { fontSize: '18px' },
  msBody: { flex: 1 },
  msLabel: { fontSize: '13px', fontWeight: '600', color: TEXT_PRIMARY },
  msMeta: { fontSize: '11px', color: TEXT_MUTED, marginTop: '2px' },
  msDone: { width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,212,161,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  bankHeader: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0
  },
  bankArrow: { fontSize: '11px', color: TEXT_MUTED },
  bankList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  bankEmpty: { fontSize: '13px', color: TEXT_MUTED, fontStyle: 'italic', padding: '10px 0', textAlign: 'center' },
  wordEntry: {
    background: BG_SURFACE, border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_MD, padding: '12px 14px'
  },
  wordTerm: { fontSize: '13px', fontWeight: '700', color: TEXT_ACCENT, marginBottom: '4px' },
  wordDef: { fontSize: '12px', color: TEXT_SECONDARY, lineHeight: '1.55' }
}
