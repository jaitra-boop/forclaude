import React from 'react'
import WordCard from '../components/cards/WordCard'
import LessonCard from '../components/cards/LessonCard'
import SparkCard from '../components/cards/SparkCard'
import WanderCard from '../components/cards/WanderCard'
import { WORDS } from '../data/words'
import { LESSONS } from '../data/lessons'
import { GAMES } from '../data/games'
import { WANDER } from '../data/wander'
import {
  BG_BASE, BORDER_SUBTLE,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  AMBER, GREEN,
  RADIUS_MD, RADIUS_PILL, FONT_BASE
} from '../theme'

const dayIndex = Math.floor(Date.now() / 86400000)
const todayWord   = WORDS[dayIndex % WORDS.length]
const todayLesson = LESSONS[dayIndex % LESSONS.length]
const todayGame   = GAMES[dayIndex % GAMES.length]
const todayWander = WANDER[dayIndex % WANDER.length]

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function DropBar({ drops }) {
  const pct = Math.min(100, (drops / 4) * 100)
  return (
    <div style={styles.dropRow}>
      <div style={styles.dropLeft}>
        <span style={styles.dropLabel}>Today's drops</span>
        <span style={styles.dropVal}>{drops.toFixed(1)} / 4</span>
      </div>
      <div style={styles.track}>
        {[0.5, 1, 2, 0.5].map((d, i) => {
          const cumulative = [0.5, 1.5, 3.5, 4][i]
          const filled = drops >= cumulative
          return (
            <div
              key={i}
              style={{
                ...styles.segment,
                flex: d,
                background: filled
                  ? 'linear-gradient(90deg,#7B2FF7,#2196F3)'
                  : 'rgba(255,255,255,0.08)',
                boxShadow: filled ? '0 0 8px rgba(123,47,247,0.4)' : 'none'
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function HomeView({ mode, appData, onDataUpdate }) {
  const today = getToday()
  const todayComp = appData?.completions?.[today] || {}
  const drops = todayComp.drops || 0

  async function handleWordReveal() {
    if (todayComp.word) return
    const data = await window.loupe.addDrop(0.5, 'word')
    await window.loupe.recordWord(todayWord.word)
    await window.loupe.updateHistory(today, { word: todayWord.word })
    onDataUpdate(data)
  }
  async function handleLessonRead() {
    if (todayComp.lesson) return
    const data = await window.loupe.addDrop(1, 'lesson')
    await window.loupe.updateHistory(today, { lesson: todayLesson.title })
    onDataUpdate(data)
  }
  async function handleSparkComplete() {
    if (todayComp.spark) return
    const data = await window.loupe.addDrop(2, 'spark')
    await window.loupe.updateHistory(today, { spark: todayGame.title })
    onDataUpdate(data)
  }
  async function handleWanderOpen() {
    if (todayComp.wander) return
    const data = await window.loupe.addDrop(0.5, 'wander')
    await window.loupe.updateHistory(today, { wander: todayWander.title })
    onDataUpdate(data)
  }

  return (
    <div style={styles.view}>
      <DropBar drops={drops} />

      {mode === 'learn' && (
        <div style={styles.cards}>
          <WordCard
            word={todayWord.word}
            definition={todayWord.definition}
            designer_tip={todayWord.designer_tip}
            revealed={!!todayComp.word}
            onReveal={handleWordReveal}
          />
          <LessonCard
            title={todayLesson.title}
            category={todayLesson.category}
            read_time={todayLesson.read_time}
            content={todayLesson.content}
            takeaway={todayLesson.takeaway}
            read={!!todayComp.lesson}
            onRead={handleLessonRead}
          />
          <SparkCard
            game={todayGame}
            completed={!!todayComp.spark}
            onComplete={handleSparkComplete}
          />
        </div>
      )}

      {mode === 'wander' && (
        <div style={styles.cards}>
          <WanderCard
            title={todayWander.title}
            url={todayWander.url}
            desc={todayWander.desc}
            tag={todayWander.tag}
            opened={!!todayComp.wander}
            onOpen={handleWanderOpen}
          />
        </div>
      )}
    </div>
  )
}

const styles = {
  view: {
    flex: 1, overflowY: 'auto',
    background: BG_BASE,
    padding: '14px 16px 20px',
    fontFamily: FONT_BASE
  },
  dropRow: {
    display: 'flex', flexDirection: 'column', gap: '7px',
    marginBottom: '18px',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: RADIUS_MD
  },
  dropLeft: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dropLabel: { fontSize: '11px', color: TEXT_MUTED, fontWeight: '500', letterSpacing: '0.2px' },
  dropVal: { fontSize: '12px', color: AMBER, fontWeight: '700' },
  track: { display: 'flex', gap: '4px', height: '5px' },
  segment: { borderRadius: RADIUS_PILL, transition: 'all 0.4s ease' },
  cards: { display: 'flex', flexDirection: 'column', gap: '18px' }
}
