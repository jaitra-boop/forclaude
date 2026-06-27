import React, { useState } from 'react'
import Jar from '../components/Jar'
import { WORDS } from '../data/words'

const BG = '#FAF7F2'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const BORDER = '#E8DDD0'
const SAGE = '#7BB8A0'
const AMBER = '#E8A020'
const CARD_BG = '#FFFFFF'

const MILESTONES = [
  { id: 'first_drop', label: 'First Drop', drops: 1, icon: '💧' },
  { id: 'one_week', label: 'One Week', days: 7, icon: '🌿' },
  { id: 'two_weeks', label: 'Two Weeks', days: 14, icon: '✨' },
  { id: 'full_jar', label: 'Full Jar', drops: 120, icon: '🫙' }
]

function StatBox({ label, value }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

export default function ProfileView({ appData }) {
  const [wordBankOpen, setWordBankOpen] = useState(false)

  const streak = appData?.streakCount || 0
  const totalDrops = appData?.totalDrops || 0
  const learnedWords = appData?.learnedWords || []
  const completions = appData?.completions || {}

  const daysLogged = Object.keys(completions).filter(d => (completions[d]?.drops || 0) > 0).length
  const fullDays = Object.keys(completions).filter(d => (completions[d]?.drops || 0) >= 4).length

  const jarPct = Math.min(100, (totalDrops / 120) * 100)
  const jarGlowing = streak >= 7
  const cracks = Object.keys(completions).reduce((acc, d) => {
    // Count as crack if there was a gap — simplified: cracks come from the profile data
    return acc
  }, 0)

  const daysToFull = Math.max(0, Math.ceil((120 - totalDrops) / 4))

  function getMilestoneStatus(ms) {
    if (ms.drops !== undefined) {
      return totalDrops >= ms.drops
    }
    if (ms.days !== undefined) {
      return streak >= ms.days || daysLogged >= ms.days
    }
    return false
  }

  const wordDefMap = Object.fromEntries(WORDS.map(w => [w.word, w.definition]))

  return (
    <div style={styles.view}>
      {/* Stats grid */}
      <div style={styles.statsGrid}>
        <StatBox label="Day streak" value={streak} />
        <StatBox label="Days logged" value={daysLogged} />
        <StatBox label="Full days" value={fullDays} />
        <StatBox label="Words learned" value={learnedWords.length} />
      </div>

      {/* Jar progress */}
      <div style={styles.jarSection}>
        <div style={styles.jarRow}>
          <Jar pct={jarPct} glowing={jarGlowing} cracks={cracks} />
          <div style={styles.jarInfo}>
            <div style={styles.jarDrops}>{totalDrops.toFixed(1)} drops</div>
            <div style={styles.jarMeta}>of 120 for a full jar</div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${jarPct}%` }} />
            </div>
            <div style={styles.jarDaysAway}>
              {totalDrops >= 120 ? '🎉 Jar complete!' : `~${daysToFull} days to full`}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Milestones</div>
        <div style={styles.milestones}>
          {MILESTONES.map(ms => {
            const achieved = getMilestoneStatus(ms)
            return (
              <div key={ms.id} style={{ ...styles.milestone, opacity: achieved ? 1 : 0.5 }}>
                <span style={styles.msIcon}>{ms.icon}</span>
                <div style={styles.msInfo}>
                  <div style={styles.msLabel}>{ms.label}</div>
                  {ms.drops && (
                    <div style={styles.msMeta}>
                      {achieved ? 'Achieved' : `${ms.drops - totalDrops} drops away`}
                    </div>
                  )}
                  {ms.days && (
                    <div style={styles.msMeta}>
                      {achieved ? 'Achieved' : `${ms.days - Math.max(streak, daysLogged)} days away`}
                    </div>
                  )}
                </div>
                {achieved && <span style={styles.msCheck}>✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Word bank */}
      <div style={styles.section}>
        <button style={styles.bankToggle} onClick={() => setWordBankOpen(o => !o)}>
          <span style={styles.sectionTitle}>Word Bank ({learnedWords.length})</span>
          <span style={styles.bankArrow}>{wordBankOpen ? '▲' : '▼'}</span>
        </button>
        {wordBankOpen && (
          <div style={styles.wordList}>
            {learnedWords.length === 0 && (
              <div style={styles.emptyBank}>Reveal today's word to start your collection.</div>
            )}
            {learnedWords.map(w => (
              <div key={w} style={styles.wordEntry}>
                <div style={styles.wordTerm}>{w}</div>
                <div style={styles.wordDef}>{wordDefMap[w] || ''}</div>
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
    flex: 1,
    overflowY: 'auto',
    background: BG,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  statBox: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    lineHeight: 1,
    letterSpacing: '-1px'
  },
  statLabel: {
    fontSize: '11px',
    color: TEXT_MUTED,
    fontWeight: '500'
  },
  jarSection: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: '14px',
    padding: '16px'
  },
  jarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  jarInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  jarDrops: {
    fontSize: '22px',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: '-0.5px'
  },
  jarMeta: {
    fontSize: '12px',
    color: TEXT_MUTED
  },
  progressBar: {
    height: '6px',
    background: '#E8DDD0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '2px'
  },
  progressFill: {
    height: '100%',
    background: SAGE,
    borderRadius: '3px',
    transition: 'width 0.4s ease'
  },
  jarDaysAway: {
    fontSize: '11px',
    color: TEXT_MUTED,
    fontStyle: 'italic'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: '0.1px'
  },
  milestones: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  milestone: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    padding: '12px'
  },
  msIcon: { fontSize: '20px' },
  msInfo: { flex: 1 },
  msLabel: { fontSize: '13px', fontWeight: '600', color: TEXT_PRIMARY },
  msMeta: { fontSize: '11px', color: TEXT_MUTED, marginTop: '2px' },
  msCheck: { fontSize: '16px', color: SAGE, fontWeight: '700' },
  bankToggle: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 0
  },
  bankArrow: { fontSize: '12px', color: TEXT_MUTED },
  wordList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  wordEntry: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    padding: '12px 14px'
  },
  wordTerm: {
    fontSize: '14px',
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: '4px'
  },
  wordDef: {
    fontSize: '12px',
    color: TEXT_MUTED,
    lineHeight: '1.5'
  },
  emptyBank: {
    fontSize: '13px',
    color: TEXT_MUTED,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '10px'
  }
}
