import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import HomeView from './views/HomeView'
import CalendarView from './views/CalendarView'
import ProfileView from './views/ProfileView'
import {
  BG_BASE, BG_SURFACE, BG_GLASS, BORDER_SUBTLE,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  GRAD_PRIMARY, GRAD_SECONDARY,
  PURPLE, BLUE,
  RADIUS_LG, RADIUS_PILL,
  SHADOW_MD, FONT_BASE
} from './theme'

function Welcome({ onStart }) {
  return (
    <div style={styles.welcome}>
      {/* Ambient glow orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.welcomeContent}>
        <div style={styles.logoWrap}>
          <span style={styles.logoSymbol}>⌕</span>
        </div>
        <h1 style={styles.welcomeTitle}>Loupe</h1>
        <p style={styles.welcomeSub}>
          A daily micro-learning ritual for UX designers navigating the AI era.
        </p>
        <p style={styles.welcomeDesc}>
          One word · One lesson · One game · One link
        </p>
        <button style={styles.startBtn} onClick={onStart}>
          Start learning
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [welcomed, setWelcomed] = useState(false)
  const [tab, setTab] = useState('home')
  const [mode, setMode] = useState('learn')
  const [appData, setAppData] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const data = await window.loupe.readData()
        setAppData(data)
        const hasHistory = Object.keys(data.completions || {}).length > 0 || data.totalDrops > 0
        setWelcomed(hasHistory)
      } catch {
        setAppData({ completions: {}, streakCount: 0, learnedWords: [], totalDrops: 0, history: {} })
      }
      setReady(true)
    }
    init()
  }, [])

  function handleDataUpdate(newData) {
    setAppData(newData)
  }

  if (!ready) return <div style={{ width: 420, height: 720, background: BG_BASE }} />

  if (!welcomed) {
    return (
      <div style={styles.app}>
        <Welcome onStart={() => setWelcomed(true)} />
      </div>
    )
  }

  const totalDrops = appData?.totalDrops || 0
  const jarPct = Math.min(100, (totalDrops / 120) * 100)
  const streak = appData?.streakCount || 0
  const jarGlowing = streak >= 7

  return (
    <div style={styles.app}>
      <Header
        tab={tab}
        mode={mode}
        onModeChange={setMode}
        jarPct={jarPct}
        jarCracks={0}
        jarGlowing={jarGlowing}
        onClose={() => window.loupe.closeWindow()}
        onMinimize={() => window.loupe.minimizeWindow()}
      />
      <div style={styles.content}>
        {tab === 'home'     && <HomeView mode={mode} appData={appData} onDataUpdate={handleDataUpdate} />}
        {tab === 'calendar' && <CalendarView appData={appData} />}
        {tab === 'profile'  && <ProfileView appData={appData} />}
      </div>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

const styles = {
  app: {
    width: '420px',
    height: '720px',
    display: 'flex',
    flexDirection: 'column',
    background: BG_BASE,
    overflow: 'hidden',
    fontFamily: FONT_BASE,
    position: 'relative'
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  // ── Welcome ──────────────────────────────────────────────
  welcome: {
    width: '420px',
    height: '720px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: BG_BASE,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: FONT_BASE
  },
  orb1: {
    position: 'absolute',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(123,47,247,0.35) 0%, transparent 70%)',
    top: '60px',
    left: '-60px',
    pointerEvents: 'none'
  },
  orb2: {
    position: 'absolute',
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(33,150,243,0.3) 0%, transparent 70%)',
    bottom: '80px',
    right: '-40px',
    pointerEvents: 'none'
  },
  welcomeContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1
  },
  logoWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '22px',
    background: GRAD_PRIMARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    boxShadow: '0 0 32px rgba(123,47,247,0.5)'
  },
  logoSymbol: {
    fontSize: '36px',
    color: '#fff',
    lineHeight: 1
  },
  welcomeTitle: {
    fontSize: '38px',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: '-1.5px',
    margin: 0,
    background: GRAD_GLOW,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  welcomeSub: {
    fontSize: '15px',
    color: TEXT_SECONDARY,
    lineHeight: '1.55',
    maxWidth: '270px',
    margin: 0
  },
  welcomeDesc: {
    fontSize: '12px',
    color: TEXT_MUTED,
    letterSpacing: '0.3px',
    margin: 0
  },
  startBtn: {
    background: GRAD_PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: RADIUS_PILL,
    padding: '14px 48px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 4px 24px rgba(123,47,247,0.5)',
    letterSpacing: '0.2px'
  }
}

// Re-export for welcome gradient reference
const GRAD_GLOW = 'linear-gradient(135deg, #B06EFA 0%, #7B2FF7 40%, #2196F3 100%)'
