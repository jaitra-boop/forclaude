import React from 'react'
import WordCard from '../components/cards/WordCard'
import LessonCard from '../components/cards/LessonCard'
import SparkCard from '../components/cards/SparkCard'
import WanderCard from '../components/cards/WanderCard'
import { WORDS } from '../data/words'
import { LESSONS } from '../data/lessons'
import { GAMES } from '../data/games'
import { WANDER } from '../data/wander'

const BG = '#FAF7F2'
const TEXT_MUTED = '#8A7D72'

const dayIndex = Math.floor(Date.now() / 86400000)
const todayWord = WORDS[dayIndex % WORDS.length]
const todayLesson = LESSONS[dayIndex % LESSONS.length]
const todayGame = GAMES[dayIndex % GAMES.length]
const todayWander = WANDER[dayIndex % WANDER.length]

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function HomeView({ mode, appData, onDataUpdate }) {
  const today = getToday()
  const todayComp = appData?.completions?.[today] || {}

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

  const totalDropsToday = todayComp.drops || 0

  return (
    <div style={styles.view}>
      <div style={styles.dropsBar}>
        <span style={styles.dropsText}>{totalDropsToday} / 4 drops today</span>
        <div style={styles.dropsTrack}>
          <div style={{ ...styles.dropsFill, width: `${(totalDropsToday / 4) * 100}%` }} />
        </div>
      </div>

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
    flex: 1,
    overflowY: 'auto',
    background: '#FAF7F2',
    padding: '16px'
  },
  dropsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  dropsText: {
    fontSize: '11px',
    color: TEXT_MUTED,
    minWidth: '100px'
  },
  dropsTrack: {
    flex: 1,
    height: '4px',
    background: '#E8DDD0',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  dropsFill: {
    height: '100%',
    background: '#7BB8A0',
    borderRadius: '2px',
    transition: 'width 0.4s ease'
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  }
}
