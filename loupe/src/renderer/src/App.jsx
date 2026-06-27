import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import HomeView from './views/HomeView'
import CalendarView from './views/CalendarView'
import ProfileView from './views/ProfileView'

const BG = '#FAF7F2'
const TEXT_PRIMARY = '#3D3530'
const TEXT_MUTED = '#8A7D72'
const SAGE = '#7BB8A0'

function Welcome({ onStart }) {
  return (
    <div style={styles.welcome}>
      <div style={styles.welcomeContent}>
        <div style={styles.logo}>⌕</div>
        <h1 style={styles.welcomeTitle}>Loupe</h1>
        <p style={styles.welcomeSub}>A daily micro-learning ritual for UX designers navigating the AI era.</p>
        <p style={styles.welcomeDesc}>One word. One lesson. One game. One link. Every day.</p>
        <button style={styles.startBtn} onClick={onStart}>Start learning</button>
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

  async function handleStart() {
    setWelcomed(true)
  }

  function handleDataUpdate(newData) {
    setAppData(newData)
  }

  if (!ready) {
    return <div style={{ ...styles.app, background: BG }} />
  }

  if (!welcomed) {
    return (
      <div style={styles.app}>
        <Welcome onStart={handleStart} />
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
        {tab === 'home' && (
          <HomeView mode={mode} appData={appData} onDataUpdate={handleDataUpdate} />
        )}
        {tab === 'calendar' && (
          <CalendarView appData={appData} />
        )}
        {tab === 'profile' && (
          <ProfileView appData={appData} />
        )}
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
    background: BG,
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  welcome: {
    width: '420px',
    height: '720px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: BG
  },
  welcomeContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    padding: '32px',
    textAlign: 'center'
  },
  logo: {
    fontSize: '56px',
    lineHeight: 1,
    marginBottom: '8px'
  },
  welcomeTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: '-1px',
    margin: 0
  },
  welcomeSub: {
    fontSize: '16px',
    color: TEXT_PRIMARY,
    lineHeight: '1.5',
    maxWidth: '280px',
    margin: 0
  },
  welcomeDesc: {
    fontSize: '13px',
    color: TEXT_MUTED,
    margin: 0
  },
  startBtn: {
    background: TEXT_PRIMARY,
    color: BG,
    border: 'none',
    borderRadius: '12px',
    padding: '14px 40px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
    letterSpacing: '0.2px'
  }
}
