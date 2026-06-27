const { app } = require('electron')
const path = require('path')
const fs = require('fs')

const DATA_FILE = path.join(app.getPath('userData'), 'loupe-data.json')

const DEFAULT_DATA = {
  completions: {},
  streakCount: 0,
  learnedWords: [],
  totalDrops: 0,
  history: {}
}

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2))
      return { ...DEFAULT_DATA }
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { ...DEFAULT_DATA }
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function addDrop(amount, element) {
  const data = readData()
  const today = getToday()

  if (!data.completions[today]) {
    data.completions[today] = { word: false, lesson: false, spark: false, wander: false, drops: 0 }
  }

  if (data.completions[today][element]) return data

  data.completions[today][element] = true
  data.completions[today].drops = (data.completions[today].drops || 0) + amount
  data.totalDrops = (data.totalDrops || 0) + amount

  writeData(data)
  return data
}

function recordWord(word) {
  const data = readData()
  if (!data.learnedWords.includes(word)) {
    data.learnedWords.push(word)
    writeData(data)
  }
  return data
}

function updateHistory(date, entry) {
  const data = readData()
  data.history[date] = { ...(data.history[date] || {}), ...entry }
  writeData(data)
  return data
}

function updateStreak() {
  const data = readData()
  const today = getToday()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const todayComplete = data.completions[today] &&
    (data.completions[today].drops || 0) >= 4

  if (todayComplete) {
    const hadYesterday = data.completions[yesterday] &&
      (data.completions[yesterday].drops || 0) > 0
    if (hadYesterday || data.streakCount === 0) {
      data.streakCount = (data.streakCount || 0) + 1
    }
    writeData(data)
  }
  return data
}

module.exports = { readData, writeData, addDrop, recordWord, updateHistory, updateStreak }
